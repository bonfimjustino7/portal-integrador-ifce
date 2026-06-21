import { ApplicationRef, ComponentRef, createComponent, EnvironmentInjector } from '@angular/core';
import { createApplication } from '@angular/platform-browser';
import { AngularDemoComponent } from './app/angular-demo.component';

type AngularMfeProps = {
  bffUrl?: string;
  domElement?: HTMLElement;
};

let appRef: ApplicationRef | null = null;
let componentRef: ComponentRef<AngularDemoComponent> | null = null;
let hostElement: HTMLElement | null = null;

async function mount(props: AngularMfeProps = {}) {
  if (componentRef) {
    return;
  }

  const container = props.domElement ?? document.getElementById('angular-mfe-root');
  if (!container) {
    throw new Error('Angular microfrontend root element was not found.');
  }

  hostElement = document.createElement('portal-angular-demo');
  container.replaceChildren(hostElement);

  appRef = await createApplication();
  componentRef = createComponent(AngularDemoComponent, {
    environmentInjector: appRef.injector as EnvironmentInjector,
    hostElement,
  });
  componentRef.setInput('bffUrl', props.bffUrl);
  appRef.attachView(componentRef.hostView);
}

async function unmount() {
  if (componentRef && appRef) {
    appRef.detachView(componentRef.hostView);
    componentRef.destroy();
    appRef.destroy();
  }

  hostElement?.remove();
  componentRef = null;
  appRef = null;
  hostElement = null;
}

declare global {
  interface Window {
    portalAngularMfe?: {
      mount: typeof mount;
      unmount: typeof unmount;
    };
  }
}

window.portalAngularMfe = { mount, unmount };
