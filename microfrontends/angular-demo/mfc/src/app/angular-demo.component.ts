import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

type StudentServiceHour = {
  day: string;
  start: string;
  end: string;
};

type ProfessorComplement = {
  legacyTeacherId?: number;
  officeLocation?: string | null;
  studentServiceHours?: StudentServiceHour[];
  researchArea?: string | null;
  lattesUrl?: string | null;
  publicNote?: string | null;
  updatedAt?: string | null;
};

type Professor = {
  id: number;
  name: string;
  email: string;
  nameCode: string;
  role: string;
  complement: ProfessorComplement | null;
};

type ScheduleAssignment = {
  disciplineName: string;
  disciplineCode?: string;
  day: string;
  time?: {
    hourStart?: string;
    hourEnd?: string;
  };
};

type ScheduleGroup = {
  semesterId?: number;
  semesterNumber?: number;
  classCode?: string;
  courseName?: string;
  assignments?: ScheduleAssignment[];
};

type ProfessorsResponse = {
  data: Professor[];
};

type ScheduleResponse = {
  professorId: number;
  schedule: ScheduleGroup[];
  complement: ProfessorComplement | null;
};

@Component({
  selector: 'portal-angular-demo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="teacher-workspace">
      <div class="state-panel error" *ngIf="professorsState === 'error'">
        {{ errorMessage }}
      </div>

      <div class="state-panel" *ngIf="professorsState === 'loading'">
        Carregando professores...
      </div>

      <div class="state-panel" *ngIf="professorsState === 'loaded' && professors.length === 0">
        Nenhum professor retornado pelas APIs integradas.
      </div>

      <div class="content-grid" *ngIf="professorsState === 'loaded' && professors.length > 0">
        <div class="teacher-list" aria-label="Lista de professores">
          <button
            class="teacher-row"
            *ngFor="let professor of professors"
            type="button"
            [class.active]="selectedProfessor?.id === professor.id"
            (click)="selectProfessor(professor)"
          >
            <span>
              <strong>{{ professor.name }}</strong>
              <small>{{ professor.email }}</small>
            </span>
            <span class="teacher-meta">
              {{ professor.nameCode || 'Sem codigo' }}
            </span>
            <span class="teacher-complement" [class.empty]="!professor.complement">
              {{ professor.complement?.researchArea || 'Sem complemento' }}
            </span>
          </button>
        </div>

        <aside class="detail-panel">
          <ng-container *ngIf="selectedProfessor; else selectPrompt">
            <div class="detail-heading">
              <div>
                <span class="eyebrow">Professor selecionado</span>
                <h3>{{ selectedProfessor.name }}</h3>
                <p>{{ selectedProfessor.email }}</p>
              </div>
              <span class="pill">{{ selectedProfessor.nameCode }}</span>
            </div>

            <section class="complement-block">
              <h4>Complemento academico</h4>
              <ng-container *ngIf="selectedProfessor.complement; else noComplement">
                <dl>
                  <div>
                    <dt>Area</dt>
                    <dd>{{ selectedProfessor.complement.researchArea || 'Nao informado' }}</dd>
                  </div>
                  <div>
                    <dt>Atendimento</dt>
                    <dd>{{ serviceHoursLabel(selectedProfessor.complement) }}</dd>
                  </div>
                  <div>
                    <dt>Local</dt>
                    <dd>{{ selectedProfessor.complement.officeLocation || 'Nao informado' }}</dd>
                  </div>
                </dl>
                <p *ngIf="selectedProfessor.complement.publicNote">
                  {{ selectedProfessor.complement.publicNote }}
                </p>
              </ng-container>
              <ng-template #noComplement>
                <p class="muted">Este professor ainda nao tem dados complementares no novo microservico.</p>
              </ng-template>
            </section>

            <section class="schedule-block">
              <div class="section-title">
                <h4>Horario publicado</h4>
                <button type="button" (click)="loadSchedule(selectedProfessor)" [disabled]="scheduleState === 'loading'">
                  Atualizar
                </button>
              </div>

              <div class="state-panel compact" *ngIf="scheduleState === 'idle'">
                Selecione atualizar para consultar o horario no legado.
              </div>
              <div class="state-panel compact" *ngIf="scheduleState === 'loading'">
                Consultando horario legado...
              </div>
              <div class="state-panel compact error" *ngIf="scheduleState === 'error'">
                {{ scheduleErrorMessage }}
              </div>
              <div class="state-panel compact" *ngIf="scheduleState === 'loaded' && schedule.length === 0">
                Nenhum horario publicado encontrado para este professor.
              </div>

              <div class="schedule-group" *ngFor="let group of schedule">
                <h5>{{ group.courseName || 'Curso nao informado' }} - {{ group.classCode || 'Turma nao informada' }}</h5>
                <ul>
                  <li *ngFor="let assignment of group.assignments || []">
                    <strong>{{ assignment.day }}</strong>
                    <span>
                      {{ assignment.time?.hourStart || '--' }}-{{ assignment.time?.hourEnd || '--' }}
                    </span>
                    <span>{{ assignment.disciplineName }}</span>
                  </li>
                </ul>
              </div>
            </section>
          </ng-container>

          <ng-template #selectPrompt>
            <div class="state-panel compact">Selecione um professor para ver detalhes.</div>
          </ng-template>
        </aside>
      </div>
    </section>
  `,
  styles: [
    `
      .teacher-workspace {
        display: grid;
        gap: 18px;
      }

      .detail-panel,
      .teacher-list,
      .state-panel {
        background: #ffffff;
        border: 1px solid #d9e1ee;
        border-radius: 8px;
      }

      .eyebrow {
        color: #1f6feb;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }

      h3,
      h4,
      h5,
      p {
        margin: 0;
      }

      h3 {
        color: #172033;
        font-size: 20px;
        margin-top: 6px;
      }

      h4 {
        color: #172033;
        font-size: 16px;
      }

      h5 {
        color: #172033;
        font-size: 14px;
      }

      p,
      small,
      dt {
        color: #667085;
      }

      p {
        line-height: 1.55;
        margin-top: 10px;
      }

      .complement-block dl div {
        background: #f4f7fb;
        border: 1px solid #d9e1ee;
        border-radius: 8px;
        padding: 12px;
      }

      dt {
        font-size: 12px;
        margin-bottom: 4px;
      }

      dd {
        color: #172033;
        font-weight: 700;
        margin: 0;
      }

      .content-grid {
        display: grid;
        gap: 18px;
        grid-template-columns: minmax(280px, 0.9fr) minmax(0, 1.4fr);
      }

      .teacher-list {
        display: grid;
        gap: 8px;
        padding: 12px;
      }

      .teacher-row {
        background: #ffffff;
        border: 1px solid #d9e1ee;
        border-radius: 8px;
        cursor: pointer;
        display: grid;
        gap: 10px;
        grid-template-columns: minmax(0, 1fr) auto;
        padding: 14px;
        text-align: left;
      }

      .teacher-row.active,
      .teacher-row:hover {
        border-color: #1f6feb;
      }

      .teacher-row strong,
      .teacher-row small,
      .teacher-complement {
        display: block;
      }

      .teacher-meta,
      .pill {
        align-self: start;
        background: #eef4ff;
        border-radius: 999px;
        color: #1f6feb;
        font-size: 12px;
        font-weight: 700;
        padding: 5px 8px;
      }

      .teacher-complement {
        color: #344054;
        grid-column: 1 / -1;
        font-size: 13px;
      }

      .teacher-complement.empty,
      .muted {
        color: #98a2b3;
      }

      .detail-panel {
        display: grid;
        gap: 18px;
        padding: 18px;
      }

      .detail-heading {
        display: flex;
        gap: 14px;
        justify-content: space-between;
      }

      .complement-block,
      .schedule-block {
        display: grid;
        gap: 12px;
      }

      .complement-block dl {
        display: grid;
        gap: 10px;
        margin: 0;
      }

      .section-title {
        align-items: center;
        display: flex;
        justify-content: space-between;
      }

      button {
        border: 0;
        font: inherit;
      }

      .section-title button {
        background: #1f6feb;
        border-radius: 8px;
        color: #ffffff;
        cursor: pointer;
        font-weight: 700;
        padding: 8px 12px;
      }

      .section-title button:disabled {
        cursor: wait;
        opacity: 0.7;
      }

      .state-panel {
        color: #344054;
        padding: 16px;
      }

      .state-panel.compact {
        background: #f8fafc;
        padding: 12px;
      }

      .state-panel.error {
        background: #fff4f4;
        border-color: #fac8c8;
        color: #b42318;
      }

      .schedule-group {
        border-top: 1px solid #d9e1ee;
        display: grid;
        gap: 10px;
        padding-top: 12px;
      }

      .schedule-group ul {
        display: grid;
        gap: 8px;
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .schedule-group li {
        background: #f4f7fb;
        border-radius: 8px;
        display: grid;
        gap: 8px;
        grid-template-columns: 90px 90px minmax(0, 1fr);
        padding: 10px;
      }

      @media (max-width: 900px) {
        .content-grid {
          grid-template-columns: 1fr;
        }

        .schedule-group li {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class AngularDemoComponent implements OnChanges {
  @Input() bffUrl = 'http://localhost:4101';
  @Input() getSsoToken?: () => string | Promise<string>;

  professors: Professor[] = [];
  selectedProfessor: Professor | null = null;
  schedule: ScheduleGroup[] = [];
  professorsState: 'idle' | 'loading' | 'loaded' | 'error' = 'idle';
  scheduleState: 'idle' | 'loading' | 'loaded' | 'error' = 'idle';
  errorMessage = '';
  scheduleErrorMessage = '';

  ngOnChanges(changes: SimpleChanges) {
    if (changes['bffUrl'] || changes['getSsoToken']) {
      void this.loadProfessors();
    }
  }

  async selectProfessor(professor: Professor) {
    this.selectedProfessor = professor;
    this.schedule = [];
    this.scheduleState = 'idle';
    await this.loadSchedule(professor);
  }

  serviceHoursLabel(complement: ProfessorComplement) {
    const hours = complement.studentServiceHours || [];
    if (hours.length === 0) {
      return 'Nao informado';
    }

    return hours.map((hour) => `${hour.day} ${hour.start}-${hour.end}`).join(', ');
  }

  async loadSchedule(professor: Professor) {
    this.scheduleState = 'loading';
    this.scheduleErrorMessage = '';

    try {
      const response = await this.fetchWithAuth(`/api/angular-demo/professors/${professor.id}/schedule`);
      if (response.status === 403) {
        throw new Error('Voce nao tem permissao para consultar o horario deste professor.');
      }
      if (!response.ok) {
        throw new Error(`BFF returned HTTP ${response.status}`);
      }

      const payload = (await response.json()) as ScheduleResponse;
      this.schedule = payload.schedule || [];
      if (payload.complement && this.selectedProfessor?.id === professor.id) {
        this.selectedProfessor = {
          ...this.selectedProfessor,
          complement: payload.complement,
        };
      }
      this.scheduleState = 'loaded';
    } catch (error) {
      this.schedule = [];
      this.scheduleState = 'error';
      this.scheduleErrorMessage =
        error instanceof Error
          ? error.message
          : 'Nao foi possivel consultar o horario do professor.';
      console.error(error);
    }
  }

  private async loadProfessors() {
    this.professorsState = 'loading';
    this.errorMessage = '';

    try {
      const response = await this.fetchWithAuth('/api/angular-demo/professors');
      if (!response.ok) {
        throw new Error(`BFF returned HTTP ${response.status}`);
      }

      const payload = (await response.json()) as ProfessorsResponse;
      this.professors = payload.data || [];
      this.professorsState = 'loaded';

      if (this.professors.length > 0) {
        await this.selectProfessor(this.professors[0]);
      }
    } catch (error) {
      this.professors = [];
      this.selectedProfessor = null;
      this.professorsState = 'error';
      this.errorMessage =
        'Nao foi possivel consultar professores pelo fluxo Angular BFF, Kong, ACL e microservico.';
      console.error(error);
    }
  }

  private async fetchWithAuth(path: string) {
    const token = await this.resolveToken();
    return fetch(`${this.bffUrl}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  private async resolveToken() {
    if (!this.getSsoToken) {
      throw new Error('Token SSO nao foi fornecido pelo Portal Shell.');
    }

    const token = await this.getSsoToken();
    if (!token) {
      throw new Error('Token SSO indisponivel.');
    }

    return token;
  }
}
