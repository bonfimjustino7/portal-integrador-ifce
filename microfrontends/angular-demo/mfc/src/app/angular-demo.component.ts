import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

type AngularDemoSummary = {
  name: string;
  type: string;
  status: string;
};

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
        <div>
          <dt>BFF</dt>
          <dd>{{ bffLabel }}</dd>
        </div>
      </dl>

      <div class="bff-panel" [class.error]="summaryState === 'error'">
        <span class="eyebrow">Dados do BFF</span>
        <ng-container [ngSwitch]="summaryState">
          <p *ngSwitchCase="'loading'">Consultando o BFF do microfrontend...</p>
          <p *ngSwitchCase="'error'">{{ errorMessage }}</p>
          <p *ngSwitchDefault>
            {{ summary?.name }} esta {{ summary?.status }} como {{ summary?.type }}.
          </p>
        </ng-container>
      </div>
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

      .bff-panel {
        background: #eef4ff;
        border: 1px solid #c9ddff;
        border-radius: 8px;
        grid-column: 1 / -1;
        padding: 16px;
      }

      .bff-panel.error {
        background: #fff4f4;
        border-color: #fac8c8;
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
export class AngularDemoComponent implements OnChanges {
  @Input() bffUrl = 'http://localhost:4101';

  summary: AngularDemoSummary | null = null;
  summaryState: 'idle' | 'loading' | 'loaded' | 'error' = 'idle';
  errorMessage = '';

  get bffLabel() {
    return this.summaryState === 'loaded' ? 'Conectado' : 'Aguardando';
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['bffUrl']) {
      void this.loadSummary();
    }
  }

  private async loadSummary() {
    this.summaryState = 'loading';
    this.errorMessage = '';

    try {
      const response = await fetch(`${this.bffUrl}/api/angular-demo/summary`);
      if (!response.ok) {
        throw new Error(`BFF returned HTTP ${response.status}`);
      }

      this.summary = (await response.json()) as AngularDemoSummary;
      this.summaryState = 'loaded';
    } catch (error) {
      this.summary = null;
      this.summaryState = 'error';
      this.errorMessage = 'Nao foi possivel consultar o BFF do microfrontend Angular.';
      console.error(error);
    }
  }
}
