import * as THREE from 'three';

const COLORS = {
  low: 0x5f7f3f,
  mid: 0xf0ab00,
  high: 0x9f2d20,
  line: 0x2d4f73
};

function queueColor(queue) {
  if (queue > 52) return COLORS.high;
  if (queue > 32) return COLORS.mid;
  return COLORS.low;
}

function disposeObject(object) {
  if (!object) return;
  object.traverse((child) => {
    if (child.geometry && typeof child.geometry.dispose === 'function') child.geometry.dispose();
    const material = child.material;
    if (Array.isArray(material)) {
      material.forEach((entry) => entry && typeof entry.dispose === 'function' && entry.dispose());
    } else if (material && typeof material.dispose === 'function') {
      material.dispose();
    }
  });
}

export function createThreeMaterialFlowScene(options = {}) {
  let container = null;
  let renderer = null;
  let scene = null;
  let camera = null;
  let group = null;
  let currentProps = {};
  let frameCount = 0;
  let droppedFrames = 0;
  let suspended = false;
  let nonBlankPixels = 0;
  let materialSignature = '';
  let rebuildCount = 0;
  const lifecycle = [];

  function push(operation, status, metadata = {}) {
    const entry = {
      schema: 'xtend.local.three-material-flow-scene.lifecycle.v1',
      framework: 'three',
      surfaceId: options.surfaceId || 'three-material-flow-scene',
      operation,
      status,
      metadata,
      timestamp: new Date().toISOString()
    };
    lifecycle.push(entry);
    if (typeof options.emit === 'function') {
      options.emit(`erp.three.material_flow.${operation}`, entry);
    }
    return {
      schema: 'xtend.xtensions.host-controller-result.v1',
      operation,
      ok: status === 'mounted' || status === 'ok' || status === 'resumed',
      status,
      hostId: options.hostId || null,
      surfaceId: options.surfaceId || null,
      timestamp: entry.timestamp,
      lifecycleRecord: entry,
      cleanupRecords: [],
      diagnostics: [],
      metadata
    };
  }

  function setCanvasSize() {
    if (!renderer || !container || !camera) return;
    const width = Math.max(240, Math.floor(container.clientWidth || 420));
    const height = Math.max(180, Math.floor(container.clientHeight || 220));
    const dpr = Math.min(1.5, Math.max(1, window.devicePixelRatio || 1));
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function rebuildMaterialFlow() {
    if (!scene) return;
    if (group) {
      scene.remove(group);
      disposeObject(group);
    }
    group = new THREE.Group();
    const nodes = currentProps.materialFlow || [];
    const positions = [];

    nodes.forEach((node, index) => {
      const radius = 0.12 + Math.min(0.14, Number(node.queue || 0) / 420);
      const geometry = new THREE.BoxGeometry(radius * 1.7, radius * 1.7, radius * 1.7);
      const material = new THREE.MeshStandardMaterial({
        color: queueColor(Number(node.queue || 0)),
        roughness: 0.58,
        metalness: 0.08
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(Number(node.x || 0), Number(node.y || 0), Number(node.z || 0));
      mesh.rotation.set(index * 0.27, index * 0.18, 0);
      group.add(mesh);
      positions.push(mesh.position.clone());
    });

    if (positions.length > 1) {
      const linePoints = [];
      positions.forEach((point, index) => {
        linePoints.push(point);
        linePoints.push(positions[(index + 1) % positions.length]);
      });
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
      const lineMaterial = new THREE.LineBasicMaterial({ color: COLORS.line });
      group.add(new THREE.LineSegments(lineGeometry, lineMaterial));
    }

    scene.add(group);
    rebuildCount += 1;
  }

  function createMaterialSignature(props = {}) {
    return JSON.stringify({
      seed: props.seed || '',
      materialFlow: props.materialFlow || []
    });
  }

  function sampleCanvasPixels() {
    if (!renderer || !container) return 0;
    const gl = renderer.getContext();
    const width = Math.min(32, Math.max(1, gl.drawingBufferWidth));
    const height = Math.min(32, Math.max(1, gl.drawingBufferHeight));
    const x = Math.max(0, Math.floor((gl.drawingBufferWidth - width) / 2));
    const y = Math.max(0, Math.floor((gl.drawingBufferHeight - height) / 2));
    const pixels = new Uint8Array(width * height * 4);
    gl.readPixels(x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    let count = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      if (pixels[index + 3] > 0 && pixels[index] + pixels[index + 1] + pixels[index + 2] > 18) count += 1;
    }
    nonBlankPixels = count;
    container.dataset.threeNonblank = String(count > 0);
    container.dataset.threeFrames = String(frameCount);
    window.__XTendResumeDemoThree = {
      frames: frameCount,
      nonBlankPixels,
      droppedFrames,
      seed: currentProps.seed || ''
    };
    return count;
  }

  function renderNow(now = performance.now(), frameBudgetMs = 16.67) {
    if (!renderer || !scene || !camera || suspended) return;
    const before = performance.now();
    setCanvasSize();
    if (group) {
      group.rotation.z = Math.sin(now / 1900) * 0.08;
      group.rotation.y += 0.006;
    }
    renderer.render(scene, camera);
    frameCount += 1;
    const duration = performance.now() - before;
    if (duration > frameBudgetMs) droppedFrames += 1;
    if (frameCount === 1 || frameCount % 15 === 0) sampleCanvasPixels();
  }

  return {
    schema: 'xtend.xtensions.host-controller.v1',
    mount(target, initialProps = {}, mountOptions = {}) {
      container = target;
      currentProps = initialProps;
      suspended = false;
      frameCount = 0;
      droppedFrames = 0;
      container.innerHTML = '';
      const canvas = document.createElement('canvas');
      canvas.className = 'three-material-flow-scene';
      canvas.setAttribute('aria-label', 'Three.js Materialfluss Surface');
      container.appendChild(canvas);
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xeef2f5);
      camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
      camera.position.set(0, 0, 4.4);
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
        preserveDrawingBuffer: true
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      scene.add(new THREE.AmbientLight(0xffffff, 0.72));
      const light = new THREE.DirectionalLight(0xffffff, 1.1);
      light.position.set(2, 3, 5);
      scene.add(light);
      materialSignature = createMaterialSignature(currentProps);
      rebuildMaterialFlow();
      container.dataset.xtensionStatus = 'mounted';
      container.dataset.xtensionFramework = 'three';
      container.dataset.threeRebuilds = String(rebuildCount);
      renderNow(performance.now(), currentProps.frameBudget && currentProps.frameBudget.targetMs || 16.67);
      sampleCanvasPixels();
      return push('mount', 'mounted', {
        ...mountOptions,
        nonBlankPixels,
        frameBudgetMs: currentProps.frameBudget && currentProps.frameBudget.targetMs || 16.67
      });
    },
    adopt(target, initialProps = {}, resumeContext = {}) {
      container = target;
      currentProps = initialProps;
      suspended = false;
      frameCount = 0;
      droppedFrames = 0;
      let runtimeZone = container.querySelector('[data-three-runtime-zone]');
      if (!runtimeZone) {
        runtimeZone = document.createElement('div');
        runtimeZone.setAttribute('data-three-runtime-zone', 'true');
        container.appendChild(runtimeZone);
      }
      let canvas = runtimeZone.querySelector('canvas');
      if (!canvas) {
        canvas = document.createElement('canvas');
        runtimeZone.appendChild(canvas);
      }
      canvas.className = 'three-material-flow-scene';
      canvas.setAttribute('aria-label', 'Three.js Materialfluss Surface');
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xeef2f5);
      camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
      camera.position.set(0, 0, 4.4);
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      scene.add(new THREE.AmbientLight(0xffffff, 0.72));
      const light = new THREE.DirectionalLight(0xffffff, 1.1);
      light.position.set(2, 3, 5);
      scene.add(light);
      materialSignature = createMaterialSignature(currentProps);
      rebuildMaterialFlow();
      const fallback = container.querySelector('[data-xtension-fallback="three-material-flow-scene"]');
      if (fallback) {
        fallback.hidden = true;
        fallback.setAttribute('aria-hidden', 'true');
        fallback.dataset.activationStatus = 'runtime-active';
      }
      container.dataset.xtensionStatus = 'resumed';
      container.dataset.xtensionFramework = 'three';
      container.dataset.threeRebuilds = String(rebuildCount);
      renderNow(performance.now(), currentProps.frameBudget && currentProps.frameBudget.targetMs || 16.67);
      return { ...push('adopt', 'resumed', resumeContext), status: 'host_activated', nodeIdentityPreserved: true, generation: resumeContext.generation || null };
    },
    update(signal = {}) {
      const nextProps = signal.props || signal || currentProps;
      const nextSignature = createMaterialSignature(nextProps);
      const shouldRebuild = nextSignature !== materialSignature;
      currentProps = nextProps;
      if (shouldRebuild) {
        materialSignature = nextSignature;
        rebuildMaterialFlow();
      }
      if (container) container.dataset.threeRebuilds = String(rebuildCount);
      renderNow(performance.now(), currentProps.frameBudget && currentProps.frameBudget.targetMs || 16.67);
      sampleCanvasPixels();
      return push('update', 'ok', {
        seed: currentProps.seed || '',
        nonBlankPixels,
        rebuild: shouldRebuild,
        rebuildCount
      });
    },
    renderFrame(frame = {}) {
      renderNow(frame.now || performance.now(), frame.frameBudgetMs || 16.67);
      return {
        schema: 'xtend.local.three-material-flow-scene.frame.v1',
        ok: true,
        frames: frameCount,
        nonBlankPixels,
        droppedFrames
      };
    },
    suspend(reason = 'host-policy') {
      suspended = true;
      if (container) container.dataset.xtensionSuspended = 'true';
      return push('suspend', 'ok', { reason });
    },
    resume(reason = 'host-policy') {
      suspended = false;
      if (container) container.dataset.xtensionSuspended = 'false';
      renderNow(performance.now(), currentProps.frameBudget && currentProps.frameBudget.targetMs || 16.67);
      return push('resume', 'resumed', { reason });
    },
    reportError(error, metadata = {}) {
      return push('reportError', 'degraded', {
        ...metadata,
        message: error && error.message ? error.message : String(error)
      });
    },
    unmount(reason = 'host-dispose') {
      suspended = true;
      if (group) {
        scene.remove(group);
        disposeObject(group);
      }
      group = null;
      if (renderer) renderer.dispose();
      renderer = null;
      scene = null;
      camera = null;
      if (container) {
        container.dataset.xtensionStatus = 'unmounted';
        container.innerHTML = '';
      }
      return push('unmount', 'ok', { reason });
    },
    snapshot() {
      return {
        schema: 'xtend.local.three-material-flow-scene.snapshot.v1',
        seed: currentProps.seed || '',
        frames: frameCount,
        nonBlankPixels,
        droppedFrames,
        rebuildCount,
        lifecycle: lifecycle.slice()
      };
    },
    getLifecycleRecords() {
      return lifecycle.slice();
    }
  };
}
