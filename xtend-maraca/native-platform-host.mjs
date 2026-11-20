// SPDX-License-Identifier: Apache-2.0
const clone = value => value === undefined ? null : JSON.parse(JSON.stringify(value));
const operations = Object.freeze({ open:'openSurface',close:'closeSurface',focus:'focusSurface',restore:'restoreSurface',update:'updateSurface',minimize:'minimizeSurface',maximize:'maximizeSurface',move:'moveSurface',resize:'resizeSurface',pin:'pinSurface',unpin:'pinSurface',collapse:'collapseSurface',expand:'expandSurface',dock:'dockSurface' });
const platformCapabilities = new Set(['router.bind','surface.bind','surface.manager.bind','surface.portal.bind']);
export const NATIVE_PLATFORM_HOST_API_VERSION = '1.0.0';

/** Private role adapter. Every identity comes from the compiled binding and the
 * actual Controller/Graph; host attributes cannot nominate another owner. */
export function createMaracaNativePlatformHost({ program, nativePort, platform }) {
  const entries = new WeakMap();
  const terminalReceipts = new WeakMap();
  const owned = new Set();
  const bounds = new WeakMap();
  function dispatch(capability,args,lease) {
    if (!platformCapabilities.has(capability)) throw new TypeError('Unknown native platform binding');
    const p = platform(), host = lease.element, id = lease.owner.surfaceId;
    let released = false, connected = false;
    const controller = p.runtimes?.surfaceController, graph = p.runtimes?.surfaceGraph;
    if (!controller || !graph || typeof controller.readSnapshot !== 'function') throw new TypeError('Native platform requires the actual Surface Controller and resource graph');
    const declarations = program.render.nativeView.bindings.filter(row => row.ref === lease.ref && row.tag === host.localName && row.repeat.length === lease.keys.length
      && nativePort.resolveSurfaceInstance(program,row.surface,lease.keys.slice(0,program.render.nativeView.scopes.find(scope=>scope.surface===row.surface)?.repeat?.length||0)) === id);
    if (declarations.length !== 1 || args.role !== host.localName) throw new TypeError('Native platform binding differs from its compiled owner');
    const declaration = declarations[0];
    const metadata = program.render.nativeView.components.find(row=>row.tag===declaration.tag);
    const definition = program.surfaces.find(row => row.id === declaration.surface);
    const read = () => controller.readSnapshot({ includeDestroyed:true }).surfaces.find(row => row.id === id);
    const live = () => lease.isAlive ? lease.isAlive() : lease.isCurrent();
    function demand(active = true) {
      const record = read();
      if (released || !live() || !record || record.generation !== lease.owner.generation || ['destroyed','destroying'].includes(record.status) || !graph.getSurface(id)) throw new TypeError('Native platform owner is stale');
      if (active && (lease.signal?.aborted || typeof lease.isActive === 'function' && !lease.isActive())) throw new TypeError('Native platform owner is inactive');
      return record;
    }
    demand();
    const surfaceId = host.getAttribute('surface-id');
    if (surfaceId && surfaceId !== id) throw new TypeError('Native surface-id must equal the exact owning Surface instance');
    const managerId = host.getAttribute('manager-id');
    if (managerId && managerId !== controller.managerId) throw new TypeError('Native manager-id must equal the actual owning Controller');
    const previous = entries.get(host); if (previous) return previous;
    let unsubscribe = null, releaseBounds = null, lastRoutePath = null;
    const listeners = [];
    const router = p.options.routerHost || p.options.router || p.options.navigationAdapter;
    const declaredPortal = capability === 'surface.portal.bind' ? program.portals?.find(row => row.id === definition?.portal) : null;
    const actualPortal = declaredPortal && graph.listPortals?.().find(row => row.id === declaredPortal.id);
    if (capability === 'surface.portal.bind' && (!declaredPortal || !actualPortal)) throw new TypeError('Native Portal must belong to its owning Surface explicit compiled Portal');
    if (declaredPortal && host.getAttribute('portal-id') && host.getAttribute('portal-id') !== declaredPortal.id) throw new TypeError('Native portal-id differs from the compiled Portal');
    if (declaredPortal && host.getAttribute('for') && ![declaredPortal.id,declaredPortal.root].includes(host.getAttribute('for'))) throw new TypeError('Native Portal target differs from the compiled Portal');
    function scopedSnapshot() {
      const snapshot = controller.readSnapshot({ includeDestroyed:true });
      const rows = graph.listInstances({ includeDestroyed:true });
      const byId = new Map(rows.map(row => [row.id,row]));
      const belongs = target => { const seen = new Set(); while (target && !seen.has(target)) { if(target === id)return true;seen.add(target);target=byId.get(target)?.parentId; } return false; };
      return clone({ ...snapshot, surfaces:snapshot.surfaces.filter(row=>belongs(row.id)), activeSurfaceId:belongs(snapshot.activeSurfaceId)?snapshot.activeSurfaceId:null, stack:snapshot.stack.filter(belongs) });
    }
    function project() {
      if (released || !live()) return;
      const record = demand(false);
      if (typeof host.applySurfaceSnapshot === 'function') host.applySurfaceSnapshot(clone(record));
    }
    function portalUpdate(patch = {}) {
      demand();
      if (!declaredPortal || !actualPortal) throw new TypeError('Native Portal update requires its explicit existing Portal');
      const expected = { policy:actualPortal.policy,layer:actualPortal.layer,target:declaredPortal.root,zIndexStart:actualPortal.zIndexStart,zStep:actualPortal.zStep };
      for (const [key,value] of Object.entries(patch)) {
        if (['schema','id','component','kernelBoundary'].includes(key)) continue;
        if (!Object.hasOwn(expected,key) || value !== expected[key]) throw new TypeError('Native Portal update may only project its existing compiled Portal policy');
      }
      return clone({ id:declaredPortal.id,...expected });
    }
    function routeList() {
      const routes = host.routes || [];
      const paths=new Set();
      if (!Array.isArray(routes) || routes.length > 256 || routes.some(row => {
        if (!row || typeof row.path !== 'string' || row.path.length>2048 || !row.path.startsWith('/') || row.path.startsWith('//') || /[\\\u0000-\u001f?#]/u.test(row.path) || Object.keys(row).some(key=>!['id','path','title'].includes(key)) || paths.has(row.path)) return true;
        paths.add(row.path);return new URL(row.path,'http://xtend.invalid/').pathname!==row.path;
      })) throw new TypeError('Managed routes require unique canonical local path data, without modules or executable handlers');
      return routes;
    }
    function currentPath() { const snapshot=router?.snapshot?.();return snapshot?.current?.path || snapshot?.currentPath || router?.currentPath || p.options.windowTarget?.location?.pathname || '/'; }
    function routeChanged() {
      if(released || !live())return;
      const path=currentPath();
      host._managedCurrentPath = path;
      if(path===lastRoutePath)return;
      lastRoutePath=path;
      const context = host[Symbol.for('xtend.native-component.managed.v2')];
      if(context?.acceptsEvent?.('route-changed') && context.isActive())context.emit('route-changed',{detail:{path:host._managedCurrentPath,source:'native-router'}});
    }
    function canNavigate(href) {
      if (!router || typeof router.navigate !== 'function') throw new TypeError('Native Router requires the existing RMT or host router port');
      const location = p.options.windowTarget?.location;
      const url = new URL(href,location?.href || 'http://xtend.invalid/');
      if (!['http:','https:'].includes(url.protocol) || location && url.origin !== location.origin || !String(href).startsWith('/')) return false;
      const routes = routeList();
      if (routes.length && !routes.some(row=>row.path === url.pathname)) return false;
      if (typeof router.canNavigate === 'function') { const result=router.canNavigate(href);return result === true || result?.capable === true; }
      return routes.some(row=>row.path === url.pathname);
    }
    function executeCommand(name,payload = {}) {
      const record=demand();
      payload=Object.fromEntries(Object.entries(payload).filter(([,value])=>value!==undefined));
      if(typeof nativePort.validateNativeComponentCommandV2!=='function')throw new TypeError('Native platform command DTO validation port is missing');
      nativePort.validateNativeComponentCommandV2(metadata,name,payload);
      if (capability === 'surface.manager.bind') { if(name!=='snapshot')throw new TypeError('Native manager only exposes its owner-scoped snapshot');return scopedSnapshot(); }
      if (capability === 'surface.portal.bind') { if(name!=='update')throw new TypeError('Unknown native Portal command');return portalUpdate(payload); }
      if (capability === 'router.bind') {
        if(name==='canNavigate')return canNavigate(payload.href);
        if(name!=='navigate'||!canNavigate(payload.href))throw new TypeError('Native navigation is outside the captured route policy');
        return Promise.resolve(router.navigate(payload.href,{state:clone(payload.state),replace:payload.replace===true,source:'rmtx-native',owner:lease.owner})).then(result=>{if(!live())throw new TypeError('Native Router owner ended during navigation');routeChanged();return result === undefined?null:clone(result);});
      }
      if (!Object.hasOwn(operations,name)) throw new TypeError('Unknown native Surface command');
      if (!record.capabilities.includes(name) || name==='dock' && payload.mode==='pinned' && !record.capabilities.includes('pin')) throw new TypeError('The actual Surface capability refused '+name);
      const method = operations[name];
      let result;
      if (name === 'open' || name === 'close' || name === 'focus') result = graph[method](id,payload);
      else if (name === 'move' || name === 'resize') result = controller[method](id,payload);
      else if (['pin','unpin','collapse','expand','dock'].includes(name)) {
        const patch=name==='pin'?{pinned:true,mode:'pinned'}:name==='unpin'?{pinned:false,mode:'docked'}:name==='collapse'?{collapsed:true,mode:'collapsed'}:name==='expand'?{collapsed:false,mode:payload.mode||'docked'}:{placement:payload.placement||record.placement||'right',mode:payload.mode,collapsed:false,pinned:payload.mode==='pinned'};
        result=controller.updateSurface(id,patch);
      }
      else {
        if (typeof controller[method] !== 'function') throw new TypeError('The actual Controller does not support this Surface operation');
        const args = name==='close'?[payload.reason]:name==='pin'?[true]:name==='unpin'?[false]:name==='expand'?[payload.mode]:name==='dock'?[payload.placement,payload.mode]:name==='update'?[payload]:[];
        result = controller[method](id,...args);
      }
      return Promise.resolve(result).then(value => {
        if (value?.ok === false) throw new TypeError(value.diagnostic?.message || 'The actual Surface capability refused this operation');
        const result=clone(value),record=read();
        if (['close','minimize','collapse'].includes(name) && result && typeof result === 'object' && live() && record?.generation===lease.owner.generation) {
          terminalReceipts.set(result,{command:name,owner:JSON.stringify(lease.owner),surfaceId:id,generation:record.generation,status:record.status,minimized:record.minimized,collapsed:record.collapsed,read,live,graph});
        }
        project();return result;
      });
    }
    function command(name,payload = {}) {
      demand();
      if(name==='snapshot'||name==='canNavigate')return executeCommand(name,payload);
      const operation = nativePort.resolveNativePlatformOperation(program,declaration.declarationId,name);
      const result=p.scheduleWork('native-platform',()=>{demand();return executeCommand(name,payload);},{operation:operation.id,sourceRef:operation.sourceRef,fiberId:operation.fiberId,lane:operation.lane,surfaceId:id,scope:id,source:'rmtx-native-platform'});
      result.catch(error=>p.onError(error));return result;
    }
    const binding = Object.freeze({ controller, manager:null, command, executeCommand,
      policySnapshot() { return portalUpdate({}); },
      connect() {
        demand();if(connected)return;connected=true;
        if(capability==='router.bind') {
          routeList();if(!router||typeof router.navigate!=='function')throw new TypeError('Native Router requires an existing route host');
          for(const target of [router,p.options.windowTarget].filter(Boolean))for(const event of target===router?['route-changed','routechange']:['popstate','hashchange'])if(typeof target.addEventListener==='function'){target.addEventListener(event,routeChanged);listeners.push(()=>target.removeEventListener(event,routeChanged));}
          host._managedCurrentPath=currentPath();lastRoutePath=host._managedCurrentPath;
        } else if(capability==='surface.portal.bind') portalUpdate({});
        else { project();unsubscribe=controller.subscribe?.(()=>{if(live())project();}); }
      },
      update(patch) {
        demand();
        if(capability==='surface.portal.bind')return portalUpdate(patch);
        if(capability==='router.bind'){
          if(Object.keys(patch).some(key=>key!=='routes'))throw new TypeError('Managed Router configuration belongs to the existing route host');
          routeList();return clone({path:currentPath(),routes:routeList()});
        }
        const allowed=capability==='surface.manager.bind'?['manager-id']:['surface-id'];
        if(Object.keys(patch).some(key=>!allowed.includes(key)))throw new TypeError('Controller-owned platform state requires a compiled component command');
        if(patch['surface-id'] && patch['surface-id']!==id || patch['manager-id'] && patch['manager-id']!==controller.managerId)throw new TypeError('Native platform attributes cannot change authority');
        return clone(read());
      },
      leaseBounds(active) {
        if(active)demand();
        releaseBounds?.();releaseBounds=null;if(!active)return;
        const target=p.viewProjectionPort.resolveSurface(id);
        if(!target||!p.root.contains(target))throw new TypeError('Surface bounds require their exact owned renderer target');
        let entry=bounds.get(target);
        if(!entry){entry={count:0,type:target.style.getPropertyValue('container-type'),name:target.style.getPropertyValue('container-name')};bounds.set(target,entry);}
        entry.count++;target.style.setProperty('container-type','inline-size');target.style.setProperty('container-name','xtend-surface-bounds');
        let returned=false;releaseBounds=()=>{if(returned)return;returned=true;if(--entry.count)return;bounds.delete(target);if(target.style.getPropertyValue('container-type')==='inline-size'){if(entry.type)target.style.setProperty('container-type',entry.type);else target.style.removeProperty('container-type');}if(target.style.getPropertyValue('container-name')==='xtend-surface-bounds'){if(entry.name)target.style.setProperty('container-name',entry.name);else target.style.removeProperty('container-name');}};
      },
      release() { if(released)return;released=true;unsubscribe?.();releaseBounds?.();listeners.splice(0).forEach(release=>release());entries.delete(host);owned.delete(binding); }
    });
    entries.set(host,binding);owned.add(binding);return binding;
  }
  return Object.freeze({dispatch,
    verifyNativeTerminalReceipt(command,result,lease) {
      if (!result || typeof result !== 'object') return false;
      const receipt=terminalReceipts.get(result),record=receipt?.read();
      if (!receipt || receipt.command!==command || receipt.owner!==JSON.stringify(lease.owner) || !receipt.live() || !lease.isCurrent() || !receipt.graph.getSurface(receipt.surfaceId) || !record || record.generation!==receipt.generation || record.status!==receipt.status || record.minimized!==receipt.minimized || record.collapsed!==receipt.collapsed) return false;
      return command==='close'?record.status==='closed':command==='minimize'?record.status==='minimized' && record.minimized===true:command==='collapse'?record.collapsed===true:false;
    },
    dispose(){for(const binding of [...owned])binding.release();}
  });
}
