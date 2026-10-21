import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthSessionService } from '../../core/auth/auth-session.service';
import { CustomerApiService } from '../customers/customer-api.service';
import { Customer } from '../customers/customer.model';
import { InteractionApiService } from './interaction-api.service';
import { Interaction } from './interaction.model';

@Component({
  selector: 'app-interaction-list-page',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink],
  host: { class: 'block w-full' },
  template: `
    <section>
      <header class="mb-6 flex flex-col items-start gap-2 border-b border-[#d5d9d6] min-[36rem]:flex-row min-[36rem]:items-baseline min-[36rem]:justify-between">
        <div>
          @if (profile(); as customer) {
            <h2 class="mb-1">{{ customer.fullName }}</h2>
            <p class="mt-0 text-[#59645d]"><code>{{ customer.publicId }}</code> · {{ customer.status }}</p>
          } @else {
            <h2>Customer profile</h2>
          }
        </div>
        <div class="flex flex-wrap items-center gap-2">
          @if (profile()) {
            <button
              type="button"
              class="cursor-pointer rounded-[3px] border border-[#176b54] bg-white px-3 py-1 font-[inherit] font-semibold text-[#176b54] disabled:cursor-wait disabled:opacity-[0.65]"
              [disabled]="savingCustomer()"
              (click)="beginCustomerEdit()"
              data-testid="edit-customer"
            >Edit customer</button>
            <button
              type="button"
              class="cursor-pointer rounded-[3px] border border-[#9d2929] bg-white px-3 py-1 font-[inherit] font-semibold text-[#9d2929] disabled:cursor-wait disabled:opacity-[0.65]"
              [disabled]="deletingCustomer()"
              (click)="removeCustomer()"
              data-testid="delete-customer"
            >{{ deletingCustomer() ? 'Deleting...' : 'Delete customer' }}</button>
          }
          <a routerLink="/customers" class="font-semibold text-[#176b54] focus:outline-2 focus:outline-offset-2 focus:outline-[#176b54]">Search</a>
        </div>
      </header>
      @if (customerError()) {
        <p class="mb-4 text-[#9d2929]" role="alert">{{ customerError() }}</p>
      }

      @if (notFound()) {
        <p class="text-[#9d2929]" role="alert" data-testid="customer-not-found">Customer not found.</p>
      } @else if (profile()) {
      @if (editingCustomer()) {
        <form #customerForm="ngForm" (ngSubmit)="saveCustomer(customerForm)" class="mb-6 grid w-full max-w-[38rem] gap-4" novalidate>
          <div class="grid gap-[0.4rem]">
            <label for="customer-name" class="font-semibold">Full name</label>
            <input
              id="customer-name"
              name="customerName"
              class="box-border w-full rounded-[3px] border border-[#87938b] bg-white p-[0.65rem] font-[inherit] text-[#18221b]"
              [(ngModel)]="customerName"
              required
              maxlength="200"
              data-testid="edit-customer-name"
            />
          </div>
          <div class="grid gap-[0.4rem]">
            <label for="customer-status" class="font-semibold">Status</label>
            <select
              id="customer-status"
              name="customerStatus"
              class="box-border w-full rounded-[3px] border border-[#87938b] bg-white p-[0.65rem] font-[inherit] text-[#18221b]"
              [(ngModel)]="customerStatus"
              required
              data-testid="edit-customer-status"
            >
              @for (option of customerStatuses; track option) {
                <option [value]="option">{{ option }}</option>
              }
            </select>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              type="submit"
              class="cursor-pointer rounded-[3px] border-0 bg-[#176b54] px-3 py-1 font-[inherit] font-semibold text-white disabled:cursor-wait disabled:opacity-[0.65]"
              [disabled]="savingCustomer()"
              data-testid="save-customer-edit"
            >{{ savingCustomer() ? 'Saving...' : 'Save customer' }}</button>
            <button
              type="button"
              class="cursor-pointer rounded-[3px] border border-[#87938b] bg-white px-3 py-1 font-[inherit] font-semibold"
              [disabled]="savingCustomer()"
              (click)="cancelCustomerEdit()"
            >Cancel</button>
          </div>
        </form>
      }
      <form #interactionForm="ngForm" (ngSubmit)="create(interactionForm)" class="grid w-full max-w-[38rem] gap-4" novalidate>
        <div class="grid gap-[0.4rem]">
          <label for="interaction-type" class="font-semibold">Interaction type <span aria-hidden="true">*</span></label>
          <select
            id="interaction-type"
            name="interactionType"
            class="box-border w-full rounded-[3px] border border-[#87938b] bg-white p-[0.65rem] font-[inherit] text-[#18221b] focus:outline-2 focus:outline-offset-2 focus:outline-[#176b54]"
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
            class="box-border w-full resize-y rounded-[3px] border border-[#87938b] bg-white p-[0.65rem] font-[inherit] text-[#18221b] focus:outline-2 focus:outline-offset-2 focus:outline-[#176b54]"
            [(ngModel)]="summary"
            #summaryControl="ngModel"
            required
            maxlength="1024"
            rows="3"
            aria-describedby="summary-hint summary-error summary-count"
            data-testid="summary"
          ></textarea>
          <div class="flex flex-wrap items-baseline justify-between gap-2 text-sm">
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
          [disabled]="saving()"
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
              class="cursor-pointer rounded-[3px] border-0 bg-[#176b54] px-4 py-[0.65rem] font-[inherit] font-semibold text-white focus:outline-2 focus:outline-offset-2 focus:outline-[#176b54]"
              (click)="retry()"
            >Try again</button>
          </div>
        } @else if (loading()) {
          <p class="text-[#59645d]" role="status">Fetching the customer timeline.</p>
        } @else if (rows().length === 0) {
          <p class="text-[#59645d]">No interactions recorded for this customer yet.</p>
        } @else {
          <ul class="m-0 list-none p-0">
            @for (row of rows(); track row.id) {
              <li class="grid grid-cols-1 items-start gap-1 border-b border-[#e1e5e2] py-[0.85rem] min-[36rem]:grid-cols-[7rem_minmax(0,1fr)_auto_auto] min-[36rem]:items-center min-[36rem]:gap-4" data-testid="interaction-row">
                @if (editingId() === row.id) {
                  <form #editForm="ngForm" (ngSubmit)="saveEdit(editForm, row)" class="col-span-full grid gap-3">
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
                  <span class="min-w-0 break-words">{{ row.summary }}</span>
                  <small class="text-[#59645d]">{{ row.createdAt | date: 'medium' }}</small>
                  <div class="flex flex-wrap gap-2">
                    <button
                      type="button"
                      class="cursor-pointer rounded-[3px] border border-[#176b54] bg-white px-3 py-1 font-[inherit] font-semibold text-[#176b54] disabled:cursor-wait disabled:opacity-[0.65]"
                      [disabled]="updatingId() !== null || deletingId() !== null"
                      [attr.aria-label]="'Edit ' + row.interactionType + ' interaction'"
                      (click)="beginEdit(row)"
                      data-testid="edit-interaction"
                    >Edit</button>
                    <button
                      type="button"
                      class="cursor-pointer rounded-[3px] border border-[#9d2929] bg-white px-3 py-1 font-[inherit] font-semibold text-[#9d2929] focus:outline-2 focus:outline-offset-2 focus:outline-[#9d2929] disabled:cursor-wait disabled:opacity-[0.65]"
                      [disabled]="deletingId() === row.id"
                      [attr.aria-label]="'Delete ' + row.interactionType + ' interaction'"
                      (click)="remove(row)"
                      data-testid="delete"
                    >
                      {{ deletingId() === row.id ? 'Deleting...' : 'Delete' }}
                    </button>
                  </div>
                }
              </li>
            }
          </ul>
        }
      </section>
      } @else if (listError()) {
        <div class="max-w-[38rem] text-[#9d2929]" role="alert">
          <p>{{ listError() }}</p>
          <button
            type="button"
            class="cursor-pointer rounded-[3px] border-0 bg-[#176b54] px-4 py-[0.65rem] font-[inherit] font-semibold text-white"
            (click)="retry()"
          >Try again</button>
        </div>
      } @else {
        <p class="text-[#59645d]" role="status">Loading the customer profile.</p>
      }
    </section>
  `,
})
export class InteractionListPageComponent {
  private readonly api = inject(InteractionApiService);
  private readonly customers = inject(CustomerApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly session = inject(AuthSessionService);

  readonly customerId = signal('');
  readonly profile = signal<Customer | null>(null);
  readonly notFound = signal(false);
  readonly customerStatuses = ['PROSPECT', 'ACTIVE', 'CLOSED'];
  readonly interactionTypes = ['CALL', 'EMAIL', 'NOTE', 'MEETING'];
  customerName = '';
  customerStatus = 'PROSPECT';
  interactionType = '';
  summary = '';
  editType = '';
  editSummary = '';
  readonly rows = signal<Interaction[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly listError = signal<string | null>(null);
  readonly createError = signal<string | null>(null);
  readonly deleteError = signal<string | null>(null);
  readonly updateError = signal<string | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly editingId = signal<string | null>(null);
  readonly updatingId = signal<string | null>(null);
  readonly editingCustomer = signal(false);
  readonly savingCustomer = signal(false);
  readonly deletingCustomer = signal(false);
  readonly customerError = signal<string | null>(null);

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('publicId') ?? '';
      this.customerId.set(id);
      this.cancelEdit();
      this.cancelCustomerEdit();
      this.open(id);
    });
  }

  private open(id: string): void {
    this.notFound.set(false);
    this.profile.set(null);
    this.rows.set([]);
    this.listError.set(null);
    if (!id) {
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.customers.get(id).subscribe({
      next: (customer) => {
        this.profile.set(customer);
        this.reload();
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 404) {
          this.notFound.set(true);
          return;
        }
        this.listError.set(this.message('load customer', err));
      },
    });
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
        customerId: this.customerId(),
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

  beginCustomerEdit(): void {
    const customer = this.profile();
    if (!customer) {
      return;
    }
    this.customerName = customer.fullName;
    this.customerStatus = customer.status;
    this.customerError.set(null);
    this.editingCustomer.set(true);
  }

  cancelCustomerEdit(): void {
    this.editingCustomer.set(false);
    this.customerError.set(null);
  }

  saveCustomer(form: NgForm): void {
    const name = this.customerName.trim();
    if (form.invalid || !name || name.length > 200 || this.savingCustomer()) {
      form.control.markAllAsTouched();
      return;
    }
    this.savingCustomer.set(true);
    this.customerError.set(null);
    this.customers.update(this.customerId(), { fullName: name, status: this.customerStatus }).subscribe({
      next: (customer) => {
        this.profile.set(customer);
        this.savingCustomer.set(false);
        this.editingCustomer.set(false);
      },
      error: (err) => {
        this.savingCustomer.set(false);
        this.customerError.set(this.message('update customer', err));
      },
    });
  }

  removeCustomer(): void {
    if (this.deletingCustomer()) {
      return;
    }
    this.customerError.set(null);
    if (!this.session.isAdmin()) {
      this.customerError.set('Only admins can delete customers.');
      return;
    }
    this.deletingCustomer.set(true);
    this.customers.delete(this.customerId()).subscribe({
      next: () => {
        this.deletingCustomer.set(false);
        void this.router.navigate(['/customers']);
      },
      error: (err) => {
        this.deletingCustomer.set(false);
        if (err.status === 403) {
          this.customerError.set('Only admins can delete customers.');
          return;
        }
        this.customerError.set(this.message('delete customer', err));
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
    if (form.invalid || !this.editType || !summary || summary.length > 1000 || this.updatingId() !== null) {
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

  retry(): void {
    if (!this.profile()) {
      this.open(this.customerId());
      return;
    }
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.listError.set(null);
    this.api.list(this.customerId()).subscribe({
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
