export type {{className}}EventName = {{featureEventTypeUnion}};

export interface {{className}}EventDetail {
  id: string;
  source: '{{tag}}';
  value: unknown;
}

export class {{className}} extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['variant', 'aria-label'];
  }

  static get xtendComponentContract() {
    return {{componentContractV2Json}} as const;
  }

  static get xtendRmtMetadata() {
    return {{rmtComponentMetadataJson}} as const;
  }

  static get xtendScaffoldA11yProfile() {
    return {{a11yProfileJson}} as const;
  }

  static get xtendScaffoldPerformanceProfile() {
    return {{performanceProfileJson}} as const;
  }

  static get xtendComponentLifecycleTelemetry() {
    return {
      schema: '{{componentLifecycleTelemetrySchema}}',
      operations: [{{componentTelemetryOperationsJson}}],
      lane: '{{performanceLane}}',
      fabricBoundary: '{{componentFabricLaneIngestionSchema}}'
    } as const;
  }

  private hydrated = false;

  connectedCallback(): void {
    this.hydrate();
    this.render();
    this.dispatchLifecycle('mount');
  }

  attributeChangedCallback(): void {
    if (this.hydrated) {
      this.render();
      this.dispatchLifecycle('update');
    }
  }

  disconnectedCallback(): void {
    this.dispatchLifecycle('unmount');
  }

  hydrate(): void {
    if (this.hydrated) {
      return;
    }

    this.hydrated = true;
    this.setAttribute('{{hydrationStateAttribute}}', 'true');
    this.dispatchLifecycle('hydrate');
  }

  render(): void {
    const label = this.getAttribute('aria-label') || '{{className}} component';
    const variant = this.getAttribute('variant') || 'default';
    this.innerHTML = `
      <section part="root" role="{{a11yRole}}" aria-label="${label}" data-variant="${variant}">
        <slot></slot>
      </section>
    `;
    this.dispatchLifecycle('render');
  }

  private dispatchLifecycle(operation: string): void {
    this.dispatchEvent(new CustomEvent('{{name}}-lifecycle', {
      bubbles: true,
      composed: true,
      detail: {
        componentId: '{{tag}}',
        operation,
        lane: '{{performanceLane}}',
        schema: '{{componentLifecycleTelemetrySchema}}'
      }
    }));
  }

  emitChange(value: unknown): void {
    this.dispatchEvent(new CustomEvent<{{className}}EventDetail>('{{componentPrimaryEventName}}', {
      bubbles: true,
      composed: true,
      detail: {
        id: this.id || '{{tag}}',
        source: '{{tag}}',
        value
      }
    }));
    this.dispatchLifecycle('event');
  }
}

if (!customElements.get('{{tag}}')) {
  customElements.define('{{tag}}', {{className}});
}

export default {{className}};
