import { enableProdMode, provideExperimentalZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication, provideClientHydration } from '@angular/platform-browser';
import { provideServerRendering, renderApplication } from '@angular/platform-server';
import {
  AngularRiskStore,
  AngularRiskWorkbenchComponent,
  XTEND_ANGULAR_HOST
} from './index.js';
import type { RiskProps } from './index.js';

const SERVER_DOCUMENT = '<!doctype html><html><head></head><body><xtend-angular-risk-workbench-root class="angular-risk-workbench-root"></xtend-angular-risk-workbench-root></body></html>';

enableProdMode();

function bodyContents(documentHtml: string): string {
  const match = /<body[^>]*>([\s\S]*?)<\/body>/iu.exec(documentHtml);
  return (match ? match[1] : documentHtml).replace('<!--nghm-->', '');
}

export async function renderAngularRiskWorkbench(props: Partial<RiskProps> = {}) {
  const store = new AngularRiskStore();
  store.setProps(props);
  const html = await renderApplication(
    (context) => bootstrapApplication(AngularRiskWorkbenchComponent, {
      providers: [
        provideServerRendering(),
        provideClientHydration(),
        provideExperimentalZonelessChangeDetection(),
        { provide: AngularRiskStore, useValue: store },
        {
          provide: XTEND_ANGULAR_HOST,
          useValue: { container: null, surfaceId: 'angular-risk-workbench', emit: undefined }
        }
      ]
    }, context),
    {
      document: SERVER_DOCUMENT,
      url: 'http://xtend.local/erp/angular-risk-workbench',
      allowedHosts: ['xtend.local']
    }
  );
  return {
    schema: 'xtend.local.angular-risk-workbench.ssr-result.v1',
    html: bodyContents(html),
    hydration: 'provideClientHydration',
    platform: '@angular/platform-server'
  };
}
