import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthSessionService } from '../../core/auth/auth-session.service';
import { InteractionApiService } from './interaction-api.service';
import { Interaction } from './interaction.model';

@Component({
  selector: 'app-interaction-list-page',
  standalone: true,
  imports: [DatePipe, FormsModule],
  template: `
    <section class="interactions-page">
      <header class="page-heading">
        <h2>Interactions</h2>
        <p>Customer <code>{{ customerId }}</code></p>
      </header>

      <form #interactionForm="ngForm" (ngSubmit)="create(interactionForm)" novalidate>
        <div class="field">
          <label for="interaction-type">Interaction type <span aria-hidden="true">*</span></label>
          <select
            id="interaction-type"
            name="interactionType"
            [(ngModel)]="interactionType"
            #typeControl="ngModel"
            required
            aria-describedby="type-hint type-error"
          >
            <option value="" disabled>Select a type</option>
            @for (type of interactionTypes; track type) {
              <option [value]="type">{{ type }}</option>
            }
          </select>
          <span id="type-hint" class="field-hint">Choose the kind of customer interaction.</span>
          @if ((typeControl.touched || interactionForm.submitted) && typeControl.invalid) {
            <p id="type-error" class="field-error">Select an interaction type.</p>
          }
        </div>

        <div class="field">
          <label for="interaction-summary">Summary <span aria-hidden="true">*</span></label>
          <textarea
            id="interaction-summary"
            name="summary"
            [(ngModel)]="summary"
            #summaryControl="ngModel"
            required
            maxlength="1024"
            rows="3"
            aria-describedby="summary-hint summary-error summary-count"
            data-testid="summary"
          ></textarea>
          <div class="field-meta">
            <span id="summary-hint" class="field-hint">Add a brief note, up to 1024 characters.</span>
            <span id="summary-count" class="field-hint">{{ summary.length }}/1024</span>
          </div>
          @if ((summaryControl.touched || interactionForm.submitted) && (!summary.trim() || summary.length > 1024)) {
            <p id="summary-error" class="field-error">
              @if (!summary.trim()) {
                Enter a summary.
              } @else {
                Summary must be 1024 characters or fewer.
              }
            </p>
          }
        </div>

        @if (createError()) {
          <p class="state-error" role="alert">{{ createError() }}</p>
        }

        <button type="submit" [disabled]="saving()" data-testid="create">
          {{ saving() ? 'Recording...' : 'Record interaction' }}
        </button>
      </form>

      <section class="timeline" aria-labelledby="timeline-heading" [attr.aria-busy]="loading()">
        <div class="timeline-heading">
          <h3 id="timeline-heading">Recent activity</h3>
          @if (loading()) {
            <span class="field-hint" role="status">Loading interactions...</span>
          }
        </div>

        @if (deleteError()) {
          <p class="state-error" role="alert">{{ deleteError() }}</p>
        }

        @if (listError()) {
          <div class="state-error" role="alert">
            <p>{{ listError() }}</p>
            <button type="button" (click)="reload()">Try again</button>
          </div>
        } @else if (loading()) {
          <p class="state-message" role="status">Fetching the customer timeline.</p>
        } @else if (rows().length === 0) {
          <p class="state-message">No interactions recorded for this customer yet.</p>
        } @else {
          <ul>
            @for (row of rows(); track row.id) {
              <li data-testid="interaction-row">
                <strong>{{ row.interactionType }}</strong>
                <span>{{ row.summary }}</span>
                <small>{{ row.createdAt | date: 'medium' }}</small>
                <button
                  type="button"
                  class="danger"
                  (click)="remove(row)"
                  [disabled]="deletingId() === row.id"
                  data-testid="delete"
                >
                  {{ deletingId() === row.id ? 'Deleting...' : 'Delete' }}
                </button>
              </li>
            }
          </ul>
        }
      </section>
    </section>
  `,
  styles: `
    :host { display: block; max-width: 54rem; }
    .page-heading, .timeline-heading, .field-meta { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; }
    .page-heading { border-bottom: 1px solid #d5d9d6; margin-bottom: 1.5rem; }
    .page-heading p, .field-hint, small { color: #59645d; }
    form { display: grid; gap: 1rem; max-width: 38rem; }
    .field { display: grid; gap: 0.4rem; }
    label { font-weight: 600; }
    input, select, textarea { box-sizing: border-box; width: 100%; border: 1px solid #87938b; border-radius: 3px; padding: 0.65rem; font: inherit; background: #fff; color: #18221b; }
    textarea { resize: vertical; }
    input:focus, select:focus, textarea:focus, button:focus-visible { outline: 2px solid #176b54; outline-offset: 2px; }
    .field-meta { font-size: 0.875rem; }
    .field-error, .state-error { color: #9d2929; }
    .field-error { margin: 0; font-size: 0.9rem; }
    button { justify-self: start; border: 0; border-radius: 3px; padding: 0.65rem 1rem; background: #176b54; color: #fff; font: inherit; font-weight: 600; cursor: pointer; }
    button.danger { justify-self: end; padding: 0.4rem 0.75rem; background: #fff; color: #9d2929; border: 1px solid #9d2929; }
    button:disabled { cursor: wait; opacity: 0.65; }
    .timeline { margin-top: 2rem; border-top: 1px solid #d5d9d6; padding-top: 1rem; }
    .timeline h3 { margin: 0; }
    .state-message { color: #59645d; }
    .state-error { max-width: 38rem; }
    .state-error p { margin: 0 0 0.75rem; }
    ul { list-style: none; margin: 0; padding: 0; }
    li { display: grid; grid-template-columns: 7rem 1fr auto auto; gap: 1rem; align-items: center; border-bottom: 1px solid #e1e5e2; padding: 0.85rem 0; }
    @media (max-width: 36rem) { li { grid-template-columns: 1fr; gap: 0.25rem; } button.danger { justify-self: start; } }
  `,
})
export class InteractionListPageComponent {
  private readonly api = inject(InteractionApiService);
  private readonly session = inject(AuthSessionService);

  readonly customerId = 'CUS-1001';
  readonly interactionTypes = ['CALL', 'EMAIL', 'NOTE', 'MEETING'];
  interactionType = '';
  summary = '';
  readonly rows = signal<Interaction[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly listError = signal<string | null>(null);
  readonly createError = signal<string | null>(null);
  readonly deleteError = signal<string | null>(null);
  readonly deletingId = signal<string | null>(null);

  constructor() {
    this.reload();
  }

  create(form: NgForm): void {
    this.createError.set(null);
    if (form.invalid || !this.summary.trim() || this.summary.length > 1024 || this.saving()) {
      form.control.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.api
      .create({
        customerId: this.customerId,
        interactionType: this.interactionType,
        summary: this.summary.trim(),
        correlationId: 'lab-request-001',
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          form.resetForm({ interactionType: '', summary: '' });
          this.reload();
        },
        error: (err) => {
          this.saving.set(false);
          this.createError.set(this.message('record interaction', err));
        },
      });
  }

  remove(row: Interaction): void {
    if (this.deletingId()) {
      return;
    }
    this.deleteError.set(null);
    if (!this.session.isAdmin()) {
      this.deleteError.set('Only admins can delete interactions.');
      return;
    }
    this.deletingId.set(row.id);
    this.api.delete(row.id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.rows.update((rows) => rows.filter((item) => item.id !== row.id));
      },
      error: (err) => {
        this.deletingId.set(null);
        if (err.status === 403) {
          this.deleteError.set('Only admins can delete interactions.');
          return;
        }
        this.deleteError.set(this.message('delete interaction', err));
      },
    });
  }

  reload(): void {
    this.loading.set(true);
    this.listError.set(null);
    this.api.list(this.customerId).subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.listError.set(this.message('load interactions', err));
      },
    });
  }

  private message(action: string, err: { status?: number }): string {
    if (err.status === 403) return `You don't have permission to ${action}.`;
    if (err.status === 401) return 'Your session expired. Sign in again.';
    if (!err.status) return `Could not ${action}. Check your connection and try again.`;
    return `Could not ${action} (HTTP ${err.status}).`;
  }
}