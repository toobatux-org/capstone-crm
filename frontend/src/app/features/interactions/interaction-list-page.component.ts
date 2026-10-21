import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthSessionService } from '../../core/auth/auth-session.service';
import { CustomerApiService } from '../customers/customer-api.service';
import { Customer } from '../customers/customer.model';
import { InteractionApiService } from './interaction-api.service';
import { Interaction } from './interaction.model';

@Component({
  selector: 'app-interaction-list-page',
  standalone: true,
  imports: [DatePipe, FormsModule],
  host: { class: 'block max-w-[54rem]' },
  template: `
    <section>
      <header class="mb-6 flex items-baseline justify-between gap-4 border-b border-[#d5d9d6]">
        <h2>Interactions</h2>
        <p class="text-[#59645d]">All customers</p>
      </header>

      <form #interactionForm="ngForm" (ngSubmit)="create(interactionForm)" class="grid max-w-[38rem] gap-4" novalidate>
        <div class="grid gap-[0.4rem]">
          <label for="customer-id" class="font-semibold">Customer <span aria-hidden="true">*</span></label>
          <select
            id="customer-id"
            name="customerId"
            class="w-full box-border rounded-[3px] border border-[#87938b] bg-white p-[0.65rem] font-[inherit] text-[#18221b] focus:outline-2 focus:outline-offset-2 focus:outline-[#176b54]"
            [(ngModel)]="customerId"
            #customerControl="ngModel"
            required
            [disabled]="customersLoading() || customers().length === 0"
            aria-describedby="customer-hint customer-error"
            data-testid="customer-select"
          >
            <option value="" disabled>Select a customer</option>
            @for (customer of customers(); track customer.customerId) {
              <option [value]="customer.customerId">{{ customer.fullName }} ({{ customer.customerId }})</option>
            }
          </select>
          @if (customersLoading()) {
            <span id="customer-hint" class="text-[#59645d]" role="status">Loading customers...</span>
          } @else if (customersError()) {
            <span id="customer-hint" class="text-[#9d2929]" role="alert">{{ customersError() }}</span>
            <button
              type="button"
              class="justify-self-start cursor-pointer rounded-[3px] border border-[#87938b] bg-white px-3 py-1 font-[inherit] font-semibold"
              (click)="loadCustomers()"
            >Retry loading customers</button>
          } @else {
            <span id="customer-hint" class="text-[#59645d]">Choose which customer this interaction is for.</span>
            @if (customers().length === 0) {
              <span class="text-[#59645d]" role="status">No customers are available.</span>
            }
          }
          @if ((customerControl.touched || interactionForm.submitted) && customerControl.invalid) {
            <p id="customer-error" class="m-0 text-[0.9rem] text-[#9d2929]">Select a customer.</p>
          }
        </div>

        <div class="grid gap-[0.4rem]">
          <label for="interaction-type" class="font-semibold">Interaction type <span aria-hidden="true">*</span></label>
          <select
            id="interaction-type"
            name="interactionType"
            class="w-full box-border rounded-[3px] border border-[#87938b] bg-white p-[0.65rem] font-[inherit] text-[#18221b] focus:outline-2 focus:outline-offset-2 focus:outline-[#176b54]"
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
          <span id="type-hint" class="text-[#59645d]">Choose the kind of customer interaction.</span>
          @if ((typeControl.touched || interactionForm.submitted) && typeControl.invalid) {
            <p id="type-error" class="m-0 text-[0.9rem] text-[#9d2929]">Select an interaction type.</p>
          }
        </div>

        <div class="grid gap-[0.4rem]">
          <label for="interaction-summary" class="font-semibold">Summary <span aria-hidden="true">*</span></label>
          <textarea
            id="interaction-summary"
            name="summary"
            class="w-full box-border resize-y rounded-[3px] border border-[#87938b] bg-white p-[0.65rem] font-[inherit] text-[#18221b] focus:outline-2 focus:outline-offset-2 focus:outline-[#176b54]"
            [(ngModel)]="summary"
            #summaryControl="ngModel"
            required
            maxlength="1024"
            rows="3"
            aria-describedby="summary-hint summary-error summary-count"
            data-testid="summary"
          ></textarea>
          <div class="flex items-baseline justify-between gap-4 text-sm">
            <span id="summary-hint" class="text-[#59645d]">Add a brief note, up to 1024 characters.</span>
            <span id="summary-count" class="text-[#59645d]">{{ summary.length }}/1024</span>
          </div>
          @if ((summaryControl.touched || interactionForm.submitted) && (!summary.trim() || summary.length > 1024)) {
            <p id="summary-error" class="m-0 text-[0.9rem] text-[#9d2929]">
              @if (!summary.trim()) {
                Enter a summary.
              } @else {
                Summary must be 1024 characters or fewer.
              }
            </p>
          }
        </div>

        @if (createError()) {
          <p class="max-w-[38rem] text-[#9d2929]" role="alert">{{ createError() }}</p>
        }

        <button
          type="submit"
          class="justify-self-start cursor-pointer rounded-[3px] border-0 bg-[#176b54] px-4 py-[0.65rem] font-[inherit] font-semibold text-white focus:outline-2 focus:outline-offset-2 focus:outline-[#176b54] disabled:cursor-wait disabled:opacity-[0.65]"
          [disabled]="saving() || customersLoading() || customers().length === 0"
          data-testid="create"
        >
          {{ saving() ? 'Recording...' : 'Record interaction' }}
        </button>
      </form>

      <section class="mt-8 border-t border-[#d5d9d6] pt-4" aria-labelledby="timeline-heading" [attr.aria-busy]="loading()">
        <div class="flex items-baseline justify-between gap-4">
          <h3 id="timeline-heading" class="m-0">Recent activity</h3>
          @if (loading()) {
            <span class="text-[#59645d]" role="status">Loading interactions...</span>
          }
        </div>

        @if (deleteError()) {
          <p class="max-w-[38rem] text-[#9d2929]" role="alert">{{ deleteError() }}</p>
        }

        @if (listError()) {
          <div class="max-w-[38rem] text-[#9d2929]" role="alert">
            <p>{{ listError() }}</p>
            <button
              type="button"
              class="justify-self-start cursor-pointer rounded-[3px] border-0 bg-[#176b54] px-4 py-[0.65rem] font-[inherit] font-semibold text-white focus:outline-2 focus:outline-offset-2 focus:outline-[#176b54]"
              (click)="reload()"
            >Try again</button>
          </div>
        } @else if (loading()) {
          <p class="text-[#59645d]" role="status">Fetching the customer timeline.</p>
        } @else if (rows().length === 0) {
          <p class="text-[#59645d]">No interactions have been recorded yet.</p>
        } @else {
          <ul class="m-0 list-none p-0">
            @for (row of rows(); track row.id) {
              <li class="grid grid-cols-[7rem_auto_1fr_auto_auto] items-baseline gap-4 border-b border-[#e1e5e2] py-[0.85rem] max-[36rem]:grid-cols-1 max-[36rem]:gap-1" data-testid="interaction-row">
                @if (editingId() === row.id) {
                  <form #editForm="ngForm" (ngSubmit)="saveEdit(editForm, row)" class="grid gap-3 max-[36rem]:col-span-1 sm:col-span-5">
                    <label class="grid gap-1 font-semibold">
                      Interaction type
                      <select
                        name="editType"
                        class="rounded-[3px] border border-[#87938b] bg-white p-2 font-[inherit]"
                        [(ngModel)]="editType"
                        required
                      >
                        @for (type of interactionTypes; track type) {
                          <option [value]="type">{{ type }}</option>
                        }
                      </select>
                    </label>
                    <label class="grid gap-1 font-semibold">
                      Summary
                      <textarea
                        name="editSummary"
                        class="rounded-[3px] border border-[#87938b] bg-white p-2 font-[inherit]"
                        [(ngModel)]="editSummary"
                        required
                        maxlength="1000"
                        rows="3"
                      ></textarea>
                    </label>
                    @if (updateError()) {
                      <p class="m-0 text-[#9d2929]" role="alert">{{ updateError() }}</p>
                    }
                    <div class="flex flex-wrap gap-2">
                      <button
                        type="submit"
                        class="cursor-pointer rounded-[3px] border-0 bg-[#176b54] px-3 py-1 font-[inherit] font-semibold text-white disabled:cursor-wait disabled:opacity-[0.65]"
                        [disabled]="updatingId() !== null"
                      >{{ updatingId() === row.id ? 'Saving...' : 'Save changes' }}</button>
                      <button
                        type="button"
                        class="cursor-pointer rounded-[3px] border border-[#87938b] bg-white px-3 py-1 font-[inherit] font-semibold"
                        [disabled]="updatingId() !== null"
                        (click)="cancelEdit()"
                      >Cancel</button>
                    </div>
                  </form>
                } @else {
                  <strong>{{ row.interactionType }}</strong>
                  <small class="text-[#59645d]">{{ row.customerId }}</small>
                  <span>{{ row.summary }}</span>
                  <small class="text-[#59645d]">{{ row.createdAt | date: 'medium' }}</small>
                  <div class="flex gap-2">
                    <button
                      type="button"
                      class="cursor-pointer rounded-[3px] border border-[#176b54] bg-white px-3 py-1 font-[inherit] font-semibold text-[#176b54] disabled:cursor-wait disabled:opacity-[0.65]"
                      [disabled]="updatingId() !== null || deletingId() !== null"
                      [attr.aria-label]="'Edit ' + row.interactionType + ' interaction'"
                      (click)="beginEdit(row)"
                      data-testid="edit-interaction"
                    >Edit</button>
                    @if (session.isAdmin()) {
                      <button
                        type="button"
                        class="cursor-pointer rounded-[3px] border border-[#9d2929] bg-white px-3 py-1 font-[inherit] font-semibold text-[#9d2929] focus:outline-2 focus:outline-offset-2 focus:outline-[#9d2929] disabled:cursor-wait disabled:opacity-[0.65]"
                        [disabled]="deletingId() !== null || updatingId() !== null"
                        [attr.aria-label]="'Delete ' + row.interactionType + ' interaction'"
                        (click)="delete(row)"
                        data-testid="delete-interaction"
                      >
                        {{ deletingId() === row.id ? 'Deleting...' : 'Delete' }}
                      </button>
                    }
                  </div>
                }
              </li>
            }
          </ul>
        }
      </section>
    </section>
  `,
})
export class InteractionListPageComponent {
  private readonly api = inject(InteractionApiService);
  private readonly customerApi = inject(CustomerApiService);
  readonly session = inject(AuthSessionService);

  customerId = 'CUS-1001';
  readonly interactionTypes = ['CALL', 'EMAIL', 'NOTE', 'MEETING'];
  interactionType = '';
  summary = '';
  readonly rows = signal<Interaction[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly deletingId = signal<string | null>(null);
  readonly editingId = signal<string | null>(null);
  readonly updatingId = signal<string | null>(null);
  readonly listError = signal<string | null>(null);
  readonly createError = signal<string | null>(null);
  readonly deleteError = signal<string | null>(null);
  readonly updateError = signal<string | null>(null);
  readonly customers = signal<Customer[]>([]);
  readonly customersLoading = signal(false);
  readonly customersError = signal<string | null>(null);
  editType = '';
  editSummary = '';

  constructor() {
    this.loadCustomers();
    this.reload();
  }

  loadCustomers(): void {
    this.customersLoading.set(true);
    this.customersError.set(null);
    this.customerApi.search('').subscribe({
      next: (customers) => {
        this.customers.set(customers);
        if (!customers.some((customer) => customer.customerId === this.customerId)) {
          this.customerId = customers[0]?.customerId ?? '';
        }
        this.customersLoading.set(false);
      },
      error: (err) => {
        this.customersLoading.set(false);
        this.customersError.set(this.message('load customers', err));
      },
    });
  }

  create(form: NgForm): void {
    this.createError.set(null);
    if (
      form.invalid ||
      !this.customerId ||
      !this.summary.trim() ||
      this.summary.length > 1024 ||
      this.saving()
    ) {
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
          form.resetForm({ customerId: this.customerId, interactionType: '', summary: '' });
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
    this.api.listAll().subscribe({
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

  beginEdit(row: Interaction): void {
    this.editingId.set(row.id);
    this.editType = row.interactionType;
    this.editSummary = row.summary;
    this.updateError.set(null);
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.editType = '';
    this.editSummary = '';
    this.updateError.set(null);
  }

  saveEdit(form: NgForm, row: Interaction): void {
    this.updateError.set(null);
    const summary = this.editSummary.trim();
    if (
      form.invalid ||
      !this.editType ||
      !summary ||
      summary.length > 1000 ||
      this.updatingId() !== null
    ) {
      form.control.markAllAsTouched();
      return;
    }

    this.updatingId.set(row.id);
    this.api.update(row.id, { interactionType: this.editType, summary }).subscribe({
      next: (updated) => {
        this.rows.update((rows) => rows.map((item) => (item.id === updated.id ? updated : item)));
        this.updatingId.set(null);
        this.cancelEdit();
      },
      error: (err) => {
        this.updatingId.set(null);
        this.updateError.set(this.message('update interaction', err));
      },
    });
  }

  delete(row: Interaction): void {
    if (this.deletingId() !== null || !window.confirm('Delete this interaction? This cannot be undone.')) {
      return;
    }

    this.deleteError.set(null);
    this.deletingId.set(row.id);
    this.api.delete(row.id).subscribe({
      next: () => {
        this.rows.update((rows) => rows.filter((item) => item.id !== row.id));
        this.deletingId.set(null);
      },
      error: (err) => {
        this.deletingId.set(null);
        this.deleteError.set(this.message('delete interaction', err));
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