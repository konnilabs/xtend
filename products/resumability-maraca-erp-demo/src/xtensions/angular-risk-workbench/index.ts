import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Injectable,
  InjectionToken,
  computed,
  inject,
  provideExperimentalZonelessChangeDetection,
  signal
} from '@angular/core';
import type { ApplicationRef, ComponentRef } from '@angular/core';
import { createApplication, provideClientHydration } from '@angular/platform-browser';

type HostEmit = (eventName: string, detail: unknown) => void;

interface RiskEntry {
  id: string;
  supplier: string;
  customer: string;
  exposure: number;
  currency: string;
  score: number;
  blockedDocs: number;
  dueHours: number;
  status: string;
  reviewer: string;
  tone: 'critical' | 'warn' | 'ok' | string;
  exposureText: string;
  selected: boolean;
}

export interface RiskProps {
  seed: string;
  company: string;
  fiscalPeriod: string;
  currency: string;
  risks: RiskEntry[];
  selectedRiskId: string;
}

interface AngularHostBridge {
  container: HTMLElement | null;
  surfaceId: string;
  emit?: HostEmit;
}

export const XTEND_ANGULAR_HOST = new InjectionToken<AngularHostBridge>('XTEND_ANGULAR_HOST');

function safeText(value: unknown): string {
  return String(value ?? '');
}

function formatAmount(value: unknown, currency = 'EUR'): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function normalizeRisks(props: Partial<RiskProps> = {}): RiskEntry[] {
  const selectedRiskId = safeText(props.selectedRiskId);
  const currency = safeText(props.currency) || 'EUR';
  return (Array.isArray(props.risks) ? props.risks : []).map((risk) => {
    const riskCurrency = safeText(risk.currency) || currency;
    return {
      ...risk,
      id: safeText(risk.id),
      supplier: safeText(risk.supplier),
      customer: safeText(risk.customer),
      currency: riskCurrency,
      exposure: Number(risk.exposure || 0),
      score: Number(risk.score || 0),
      blockedDocs: Number(risk.blockedDocs || 0),
      dueHours: Number(risk.dueHours || 0),
      status: safeText(risk.status),
      reviewer: safeText(risk.reviewer),
      tone: safeText(risk.tone) || 'ok',
      exposureText: formatAmount(risk.exposure, riskCurrency),
      selected: safeText(risk.id) === selectedRiskId
    };
  });
}

function normalizeProps(props: Partial<RiskProps> = {}): RiskProps {
  return {
    seed: safeText(props.seed),
    company: safeText(props.company),
    fiscalPeriod: safeText(props.fiscalPeriod),
    currency: safeText(props.currency) || 'EUR',
    selectedRiskId: safeText(props.selectedRiskId),
    risks: normalizeRisks(props)
  };
}

function createShellIntentEvent(detail: Record<string, unknown>): CustomEvent<Record<string, unknown>> {
  return new CustomEvent('xtend-command', {
    bubbles: true,
    composed: true,
    detail
  });
}

@Injectable()
export class AngularRiskStore {
  private readonly propsSignal = signal<RiskProps>(normalizeProps());
  readonly props = this.propsSignal.asReadonly();
  readonly risks = computed(() => this.props().risks);
  readonly selectedRiskId = computed(() => this.props().selectedRiskId);
  readonly criticalCount = computed(() => this.risks().filter((risk) => risk.tone === 'critical').length);
  readonly totalExposure = computed(() => this.risks().reduce((total, risk) => total + risk.exposure, 0));
  readonly highestRisk = computed(() => this.risks().slice().sort((a, b) => {
    if (a.tone === 'critical' && b.tone !== 'critical') return -1;
    if (b.tone === 'critical' && a.tone !== 'critical') return 1;
    return b.exposure - a.exposure;
  })[0] || null);

  setProps(props: Partial<RiskProps>): void {
    this.propsSignal.set(normalizeProps(props));
  }

  selectRisk(riskId: string): void {
    const current = this.props();
    this.propsSignal.set(normalizeProps({
      ...current,
      selectedRiskId: riskId
    }));
  }
}

@Component({
  selector: 'xtend-angular-risk-workbench-root',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="angular-risk-workbench" [attr.data-selected-risk]="selectedRiskId()">
      <div class="angular-risk-toolbar">
        <div>
          <b>{{ store.props().company }}</b>
          <span>{{ store.props().fiscalPeriod }}</span>
        </div>
        <button type="button" class="angular-risk-command" (click)="select(highestRisk())">Erste Pruefung</button>
      </div>
      <div class="angular-risk-summary">
        <span><b>{{ risks().length }}</b> Risiken</span>
        <span><b>{{ criticalCount() }}</b> Kritisch</span>
        <span><b>{{ totalExposureText() }}</b> Exposure</span>
      </div>
      <table class="angular-risk-table">
        <thead>
          <tr>
            <th>Risiko</th>
            <th>Partner</th>
            <th>Status</th>
            <th class="num">Score</th>
            <th class="num">Sperren</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let risk of risks(); trackBy: trackRisk"
            [class.is-selected]="risk.selected"
            [class.is-critical]="risk.tone === 'critical'"
            [class.is-warn]="risk.tone === 'warn'"
            data-xtend-command="erp.shell.inspectAngularRisk"
            [attr.data-risk-id]="risk.id"
            tabindex="0"
            (click)="select(risk)"
            (keydown.enter)="select(risk)">
            <td>{{ risk.id }}</td>
            <td>{{ risk.supplier }}</td>
            <td>{{ risk.status }}</td>
            <td class="num">{{ risk.score }}</td>
            <td class="num">{{ risk.blockedDocs }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  `
})
export class AngularRiskWorkbenchComponent {
  readonly store = inject(AngularRiskStore);
  private readonly host = inject(XTEND_ANGULAR_HOST);
  readonly risks = this.store.risks;
  readonly selectedRiskId = this.store.selectedRiskId;
  readonly criticalCount = this.store.criticalCount;
  readonly highestRisk = this.store.highestRisk;

  totalExposureText(): string {
    return formatAmount(this.store.totalExposure(), this.store.props().currency);
  }

  trackRisk(_index: number, risk: RiskEntry): string {
    return risk.id;
  }

  select(risk: RiskEntry | null): void {
    if (!risk) return;
    this.store.selectRisk(risk.id);
    const detail = {
      schema: 'xtend.local.angular-risk-workbench.intent.v1',
      command: 'erp.shell.inspectAngularRisk',
      sourceId: 'angular-risk-workbench',
      riskId: risk.id,
      supplier: risk.supplier,
      status: risk.status,
      seed: this.store.props().seed
    };
    if (typeof this.host.emit === 'function') {
      this.host.emit('erp.angular.risk.selected', detail);
    }
    if (this.host.container) {
      this.host.container.dispatchEvent(createShellIntentEvent(detail));
    }
  }
}

function resultFor(
  operation: string,
  status: string,
  options: Record<string, unknown> = {},
  metadata: Record<string, unknown> = {},
  cleanupRecords: Record<string, unknown>[] = []
): Record<string, unknown> {
  const timestamp = new Date().toISOString();
  return {
    schema: 'xtend.xtensions.host-controller-result.v1',
    operation,
    ok: status === 'mounted' || status === 'ok' || status === 'resumed',
    status,
    hostId: options.hostId || null,
    surfaceId: options.surfaceId || null,
    timestamp,
    lifecycleRecord: {
      schema: 'xtend.local.angular-risk-workbench.lifecycle.v1',
      framework: 'angular',
      surfaceId: options.surfaceId || 'angular-risk-workbench',
      operation,
      status,
      metadata,
      timestamp
    },
    cleanupRecords,
    diagnostics: [],
    metadata
  };
}

export function createAngularRiskWorkbench(options: Record<string, unknown> = {}) {
  let container: HTMLElement | null = null;
  let appRef: ApplicationRef | null = null;
  let componentRef: ComponentRef<AngularRiskWorkbenchComponent> | null = null;
  let store: AngularRiskStore | null = null;
  let currentProps: Partial<RiskProps> = {};
  let modelUpdates = 0;
  const lifecycle: unknown[] = [];

  function push(operation: string, status: string, metadata: Record<string, unknown> = {}, cleanupRecords: Record<string, unknown>[] = []) {
    const result = resultFor(operation, status, options, metadata, cleanupRecords);
    lifecycle.push(result.lifecycleRecord);
    const emit = options.emit as HostEmit | undefined;
    if (typeof emit === 'function') {
      emit(`erp.angular.risk.${operation}`, result.lifecycleRecord);
    }
    return result;
  }

  function markTick(): void {
    if (appRef && typeof appRef.tick === 'function') {
      appRef.tick();
    }
  }

  return {
    schema: 'xtend.xtensions.host-controller.v1',
    async mount(target: HTMLElement, initialProps: Partial<RiskProps> = {}, mountOptions: Record<string, unknown> = {}) {
      container = target;
      currentProps = initialProps;
      container.classList.add('angular-risk-workbench-host');
      container.dataset.xtensionStatus = 'mounting';
      container.dataset.xtensionFramework = 'angular';
      container.dataset.angularStatus = 'loading';
      const fallback = container.querySelector<HTMLElement>('.erp-angular-fallback');
      if (fallback) {
        fallback.hidden = true;
        fallback.dataset.angularStatus = 'client-hidden';
      }
      const root = document.createElement('xtend-angular-risk-workbench-root');
      root.className = 'angular-risk-workbench-root';
      container.appendChild(root);
      appRef = await createApplication({
        providers: [
          AngularRiskStore,
          provideExperimentalZonelessChangeDetection(),
          {
            provide: XTEND_ANGULAR_HOST,
            useValue: {
              container,
              surfaceId: 'angular-risk-workbench',
              emit: options.emit
            }
          }
        ]
      });
      store = appRef.injector.get(AngularRiskStore);
      store.setProps(initialProps);
      componentRef = appRef.bootstrap(AngularRiskWorkbenchComponent, root);
      markTick();
      container.dataset.xtensionStatus = 'mounted';
      container.dataset.angularStatus = 'mounted';
      container.dataset.angularModelUpdates = String(modelUpdates);
      return push('mount', 'mounted', {
        ...mountOptions,
        buildMode: 'aot',
        riskCount: normalizeProps(currentProps).risks.length
      });
    },
    async adopt(target: HTMLElement, initialProps: Partial<RiskProps> = {}, resumeContext: Record<string, unknown> = {}) {
      container = target;
      currentProps = initialProps;
      const root = container.querySelector<HTMLElement>('xtend-angular-risk-workbench-root');
      if (!root) throw new Error('Angular SSR root is missing.');
      appRef = await createApplication({
        providers: [
          AngularRiskStore,
          provideClientHydration(),
          provideExperimentalZonelessChangeDetection(),
          {
            provide: XTEND_ANGULAR_HOST,
            useValue: { container, surfaceId: 'angular-risk-workbench', emit: options.emit }
          }
        ]
      });
      store = appRef.injector.get(AngularRiskStore);
      store.setProps(initialProps);
      componentRef = appRef.bootstrap(AngularRiskWorkbenchComponent, root);
      markTick();
      container.dataset.xtensionStatus = 'resumed';
      container.dataset.angularStatus = 'dom-hydrated';
      return { ...push('adopt', 'resumed', resumeContext), status: 'dom_hydrated', nodeIdentityPreserved: true, generation: String(resumeContext.generation || '') };
    },
    update(signalValue: { props?: Partial<RiskProps>; reason?: string } | Partial<RiskProps> = {}) {
      const updateEnvelope = signalValue as { props?: Partial<RiskProps>; reason?: string };
      const nextProps = updateEnvelope.props || (signalValue as Partial<RiskProps>);
      currentProps = nextProps || currentProps;
      if (store) {
        store.setProps(currentProps);
        modelUpdates += 1;
        markTick();
      }
      if (container) {
        container.dataset.angularStatus = 'mounted';
        container.dataset.angularModelUpdates = String(modelUpdates);
      }
      return push('update', 'ok', {
        seed: currentProps.seed || '',
        reason: updateEnvelope.reason || 'update',
        modelUpdates
      });
    },
    suspend(reason = 'host-policy') {
      if (container) container.dataset.xtensionSuspended = 'true';
      return push('suspend', 'ok', { reason });
    },
    resume(reason = 'host-policy') {
      if (container) container.dataset.xtensionSuspended = 'false';
      markTick();
      return push('resume', 'resumed', { reason });
    },
    reportError(error: unknown, metadata: Record<string, unknown> = {}) {
      if (container) container.dataset.xtensionStatus = 'degraded';
      return push('reportError', 'degraded', {
        ...metadata,
        message: error instanceof Error ? error.message : String(error)
      });
    },
    unmount(reason = 'host-dispose') {
      const cleanupRecords: Record<string, unknown>[] = [];
      if (componentRef) {
        componentRef.destroy();
        cleanupRecords.push({ resource: 'angular-component-ref', status: 'destroyed' });
      }
      if (appRef) {
        appRef.destroy();
        cleanupRecords.push({ resource: 'angular-application-ref', status: 'destroyed' });
      }
      componentRef = null;
      appRef = null;
      store = null;
      if (container) {
        container.dataset.xtensionStatus = 'unmounted';
        container.dataset.angularStatus = 'unmounted';
        container.innerHTML = '';
      }
      return push('unmount', 'ok', { reason }, cleanupRecords);
    },
    snapshot() {
      return {
        schema: 'xtend.local.angular-risk-workbench.snapshot.v1',
        seed: currentProps.seed || '',
        selectedRiskId: currentProps.selectedRiskId || '',
        riskCount: normalizeProps(currentProps).risks.length,
        modelUpdates,
        lifecycle: lifecycle.slice()
      };
    },
    getLifecycleRecords() {
      return lifecycle.slice();
    }
  };
}
