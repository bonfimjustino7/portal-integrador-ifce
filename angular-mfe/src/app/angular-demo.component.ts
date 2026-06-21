import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'portal-angular-demo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="angular-card">
      <div>
        <span class="eyebrow">Angular Microfrontend</span>
        <h2>Modulo academico em Angular</h2>
        <p>
          Este modulo e carregado sob demanda pelo Portal Shell via Single-SPA,
          demonstrando que novos dominios podem usar frameworks diferentes sem
          alterar o sistema legado.
        </p>
      </div>

      <dl class="status-grid">
        <div>
          <dt>Framework</dt>
          <dd>Angular 18</dd>
        </div>
        <div>
          <dt>Rota</dt>
          <dd>/mfe/angular</dd>
        </div>
        <div>
          <dt>Integracao</dt>
          <dd>Lazy load</dd>
        </div>
      </dl>
    </section>
  `,
  styles: [
    `
      .angular-card {
        background: #ffffff;
        border: 1px solid #d9e1ee;
        border-radius: 8px;
        display: grid;
        gap: 24px;
        grid-template-columns: minmax(0, 1.6fr) minmax(240px, 0.8fr);
        padding: 24px;
      }

      .eyebrow {
        color: #1f6feb;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }

      h2 {
        color: #172033;
        font-size: 24px;
        margin: 8px 0 10px;
      }

      p {
        color: #667085;
        line-height: 1.6;
        margin: 0;
      }

      .status-grid {
        display: grid;
        gap: 12px;
        margin: 0;
      }

      .status-grid div {
        background: #f4f7fb;
        border: 1px solid #d9e1ee;
        border-radius: 8px;
        padding: 14px;
      }

      dt {
        color: #667085;
        font-size: 12px;
        margin-bottom: 6px;
      }

      dd {
        color: #172033;
        font-weight: 700;
        margin: 0;
      }

      @media (max-width: 760px) {
        .angular-card {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class AngularDemoComponent {}
