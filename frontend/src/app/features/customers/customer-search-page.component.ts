import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CustomerApiService } from './customer-api.service';
import { Customer } from './customer.model';
import { AuthSessionService } from '../../core/auth/auth-session.service';
import { InteractionApiService } from '../interactions/interaction-api.service';
import { CreateInteractionRequest, Interaction } from '../interactions/interaction.model';

@Component({
  selector: 'app-customer-search-page',
  standalone: true,
  imports: [DatePipe, FormsModule],
  host: { class: 'block max-w-[70rem]' },
  template: `
    <section>
      <header class="mb-6 border-b border-[#d5d9d6]">
        <h2 class="mb-2">Customers</h2>
        <p class="mt-0 text-[#59645d]">Search by customer name or ID to view a profile and its interaction history.</p>
      </header>

      <form (ngSubmit)="searchCustomers()" class="mb-6 flex max-w-[38rem] gap-3 max-[36rem]:flex-col">
        <label class="sr-only" for="customer-search">Customer name or ID</label>
        <input
          id="customer-search"
          name="query"
          class="min-w-0 flex-1 rounded-[3px] border border-[#87938b] bg-white p-[0.65rem] font-[inherit] text-[#18221b] focus:outline-2 focus:outline-offset-2 focus:outline-[#176b54]"
          [(ngModel)]="query"
          placeholder="Name or customer ID"
          autocomplete="off"
          required
        />
        <button
          type="submit"
          class="cursor-pointer rounded-[3px] border-0 bg-[#176b54] px-4 py-[0.65rem] font-[inherit] font-semibold text-white focus:outline-2 focus:outline-offset-2 focus:outline-[#176b54] disabled:cursor-wait disabled:opacity-[0.65]"
          [disabled]="searching()"
        >
          {{ searching() ? 'Searching...' : 'Search customers' }}
        </button>
      </form>

      @if (searchError()) {
        <p class="max-w-[38rem] text-[#9d2929]" role="alert">{{ searchError() }}</p>
      }
      @if (hasSearched() && !searching() && !searchError() && customers().length === 0) {
        <p class="text-[#59645d]" role="status">No customers matched “{{ lastQuery() }}”.</p>
      }
      @if (customers().length > 0) {
        <section class="mb-8" aria-labelledby="search-results-heading">
          <h3 id="search-results-heading">Search results</h3>
          <ul class="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
            @for (customer of customers(); track customer.customerId) {
              <li>
                <button
                  type="button"
                  class="w-full cursor-pointer rounded border border-[#d5d9d6] bg-white p-4 text-left font-[inherit] hover:border-[#176b54] focus:outline-2 focus:outline-offset-2 focus:outline-[#176b54]"
                  [attr.aria-pressed]="selected()?.customerId === customer.customerId"
                  (click)="selectCustomer(customer)"
                >
                  <strong class="block">{{ customer.fullName }}</strong>
                  <span class="text-[#59645d]">{{ customer.customerId }} · {{ customer.status }}</span>
                </button>
              </li>
            }
          </ul>
        </section>
      }

      @if (selected(); as customer) {
        <section class="border-t border-[#d5d9d6] pt-5" aria-labelledby="customer-profile-heading">
          <div class="mb-6">
            <p class="mb-1 text-sm font-semibold uppercase tracking-wide text-[#59645d]">Customer profile</p>
            <h2 id="customer-profile-heading" class="mb-2">{{ customer.fullName }}</h2>
            <dl class="grid max-w-[38rem] grid-cols-[auto_1fr] gap-x-5 gap-y-2">
              <dt class="font-semibold">Customer ID</dt><dd class="m-0">{{ customer.customerId }}</dd>
              <dt class="font-semibold">Status</dt><dd class="m-0">{{ customer.status }}</dd>
              <dt class="font-semibold">Customer since</dt><dd class="m-0">{{ customer.createdAt | date: 'longDate' }}</dd>
            </dl>
          </div>

          <form #interactionForm="ngForm" (ngSubmit)="createInteraction(interactionForm, customer)" class="mb-8 grid max-w-[38rem] gap-4 border-y border-[#d5d9d6] py-5" novalidate>
            <h3 class="m-0">Record an interaction</h3>
            <div class="grid gap-2">
              <label for="interaction-type" class="font-semibold">Interaction type <span aria-hidden="true">*</span></label>
              <select
                id="interaction-type"
                name="interactionType"
                class="w-full rounded-[3px] border border-[#87938b] bg-white p-[0.65rem] font-[inherit] text-[#18221b] focus:outline-2 focus:outline-offset-2 focus:outline-[#176b54]"
                [(ngModel)]="interactionType"
                #typeControl="ngModel"
                required
                aria-describedby="type-error"
              >
                <option value="" disabled>Select a type</option>
                @for (type of interactionTypes; track type) {
                  <option [value]="type">{{ type }}</option>
                }
              </select>
              @if ((typeControl.touched || interactionForm.submitted) && typeControl.invalid) {
                <p id="type-error" class="m-0 text-sm text-[#9d2929]">Select an interaction type.</p>
              }
            </div>
            <div class="grid gap-2">
              <label for="interaction-summary" class="font-semibold">Summary <span aria-hidden="true">*</span></label>
              <textarea
                id="interaction-summary"
                name="summary"
                class="w-full resize-y rounded-[3px] border border-[#87938b] bg-white p-[0.65rem] font-[inherit] text-[#18221b] focus:outline-2 focus:outline-offset-2 focus:outline-[#176b54]"
                [(ngModel)]="summary"
                #summaryControl="ngModel"
                required
                maxlength="1024"
                rows="3"
                aria-describedby="summary-error"
              ></textarea>
              @if ((summaryControl.touched || interactionForm.submitted) && (!summary.trim() || summary.length > 1024)) {
                <p id="summary-error" class="m-0 text-sm text-[#9d2929]">
                  {{ !summary.trim() ? 'Enter a summary.' : 'Summary must be 1024 characters or fewer.' }}
                </p>
              }
            </div>
            @if (createError()) {
              <p class="m-0 text-[#9d2929]" role="alert">{{ createError() }}</p>
            }
            <button
              type="submit"
              class="justify-self-start cursor-pointer rounded-[3px] border-0 bg-[#176b54] px-4 py-[0.65rem] font-[inherit] font-semibold text-white focus:outline-2 focus:outline-offset-2 focus:outline-[#176b54] disabled:cursor-wait disabled:opacity-[0.65]"
              [disabled]="saving()"
            >
              {{ saving() ? 'Recording...' : 'Record interaction' }}
            </button>
          </form>

          <section aria-labelledby="timeline-heading" [attr.aria-busy]="loadingTimeline()">
            <div class="flex items-baseline justify-between gap-4">
              <h3 id="timeline-heading">Interaction timeline</h3>
              @if (loadingTimeline()) {
                <span class="text-[#59645d]" role="status">Loading timeline...</span>
              }
            </div>
            @if (timelineError()) {
              <div class="max-w-[38rem] text-[#9d2929]" role="alert">
                <p>{{ timelineError() }}</p>
                <button
                  type="button"
                  class="cursor-pointer rounded-[3px] border-0 bg-[#176b54] px-4 py-[0.65rem] font-[inherit] font-semibold text-white focus:outline-2 focus:outline-offset-2 focus:outline-[#176b54]"
                  (click)="loadTimeline(customer)"
                >Try again</button>
              </div>
            } @else if (loadingTimeline()) {
              <p class="text-[#59645d]" role="status">Fetching interactions for {{ customer.fullName }}.</p>
            } @else if (interactions().length === 0) {
              <p class="text-[#59645d]">No interactions have been recorded for this customer yet.</p>
            } @else {
              <ol class="m-0 list-none border-l-2 border-[#d5d9d6] pl-5">
                @for (interaction of interactions(); track interaction.id) {
                  <li class="relative grid gap-2 border-b border-[#e1e5e2] py-4 sm:grid-cols-[8rem_1fr_auto] sm:items-baseline" data-testid="timeline-item">
                    @if (editingId() === interaction.id) {
                      <form #editForm="ngForm" (ngSubmit)="saveEdit(editForm, interaction)" class="grid gap-3 sm:col-span-3">
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
                          >{{ updatingId() === interaction.id ? 'Saving...' : 'Save changes' }}</button>
                          <button
                            type="button"
                            class="cursor-pointer rounded-[3px] border border-[#87938b] bg-white px-3 py-1 font-[inherit] font-semibold"
                            [disabled]="updatingId() !== null"
                            (click)="cancelEdit()"
                          >Cancel</button>
                        </div>
                      </form>
                    } @else {
                      <span class="font-semibold">{{ interaction.interactionType }}</span>
                      <span>{{ interaction.summary }}</span>
                      <time class="text-sm text-[#59645d]" [attr.datetime]="interaction.createdAt">{{ interaction.createdAt | date: 'medium' }}</time>
                      <div class="flex flex-wrap gap-2 sm:col-start-3">
                        <button
                          type="button"
                          class="cursor-pointer rounded-[3px] border border-[#176b54] bg-white px-3 py-1 font-[inherit] font-semibold text-[#176b54] disabled:cursor-wait disabled:opacity-[0.65]"
                          [disabled]="updatingId() !== null || deletingId() !== null"
                          [attr.aria-label]="'Edit ' + interaction.interactionType + ' interaction'"
                          (click)="beginEdit(interaction)"
                        >Edit</button>
                        @if (session.isAdmin()) {
                          <button
                            type="button"
                            class="cursor-pointer rounded-[3px] border border-[#9d2929] bg-white px-3 py-1 font-[inherit] font-semibold text-[#9d2929] focus:outline-2 focus:outline-offset-2 focus:outline-[#9d2929] disabled:cursor-wait disabled:opacity-[0.65]"
                            [disabled]="deletingId() !== null || updatingId() !== null"
                            [attr.aria-label]="'Delete ' + interaction.interactionType + ' interaction'"
                            (click)="deleteInteraction(interaction)"
                          >{{ deletingId() === interaction.id ? 'Deleting...' : 'Delete' }}</button>
                        }
                      </div>
                    }
                  </li>
                }
              </ol>
            }
            @if (deleteError()) {
              <p class="text-[#9d2929]" role="alert">{{ deleteError() }}</p>
            }
          </section>
        </section>
      }
    </section>
  `,
})
export class CustomerSearchPageComponent {
  private readonly customerApi = inject(CustomerApiService);
  private readonly interactionApi = inject(InteractionApiService);
  readonly session = inject(AuthSessionService);

  readonly interactionTypes = ['CALL', 'EMAIL', 'NOTE', 'MEETING'];
  query = '';
  lastQuery = signal('');
  interactionType = '';
  summary = '';
  readonly customers = signal<Customer[]>([]);
  readonly selected = signal<Customer | null>(null);
  readonly interactions = signal<Interaction[]>([]);
  readonly searching = signal(false);
  readonly hasSearched = signal(false);
  readonly loadingTimeline = signal(false);
  readonly saving = signal(false);
  readonly deletingId = signal<string | null>(null);
  readonly editingId = signal<string | null>(null);
  readonly updatingId = signal<string | null>(null);
  readonly searchError = signal<string | null>(null);
  readonly timelineError = signal<string | null>(null);
  readonly createError = signal<string | null>(null);
  readonly deleteError = signal<string | null>(null);
  readonly updateError = signal<string | null>(null);
  editType = '';
  editSummary = '';
  private searchRequest = 0;
  private timelineRequest = 0;

  searchCustomers(): void {
    const query = this.query.trim();
    if (!query || this.searching()) return;

    const request = ++this.searchRequest;
    this.lastQuery.set(query);
    this.searching.set(true);
    this.hasSearched.set(true);
    this.searchError.set(null);
    this.selected.set(null);
    this.interactions.set([]);
    this.loadingTimeline.set(false);
    this.timelineRequest++;
    this.customerApi.search(query).subscribe({
      next: (customers) => {
        if (request !== this.searchRequest) return;
        this.customers.set(customers);
        this.searching.set(false);
      },
      error: (err) => {
        if (request !== this.searchRequest) return;
        this.searching.set(false);
        this.searchError.set(this.message('search customers', err));
      },
    });
  }

  selectCustomer(customer: Customer): void {
    if (this.selected()?.customerId !== customer.customerId) {
      this.interactionType = '';
      this.summary = '';
    }
    this.createError.set(null);
    this.selected.set(customer);
    this.loadTimeline(customer);
  }

  loadTimeline(customer: Customer): void {
    const request = ++this.timelineRequest;
    this.loadingTimeline.set(true);
    this.timelineError.set(null);
    this.deleteError.set(null);
    this.interactionApi.list(customer.customerId).subscribe({
      next: (interactions) => {
        if (request !== this.timelineRequest) return;
        this.interactions.set(interactions);
        this.loadingTimeline.set(false);
      },
      error: (err) => {
        if (request !== this.timelineRequest) return;
        this.loadingTimeline.set(false);
        this.timelineError.set(this.message('load the customer timeline', err));
      },
    });
  }

  createInteraction(form: NgForm, customer: Customer): void {
    this.createError.set(null);
    if (form.invalid || !this.summary.trim() || this.summary.length > 1024 || this.saving()) {
      form.control.markAllAsTouched();
      return;
    }

    const request: CreateInteractionRequest = {
      customerId: customer.customerId,
      interactionType: this.interactionType,
      summary: this.summary.trim(),
    };
    this.saving.set(true);
    this.interactionApi.create(request).subscribe({
      next: () => {
        this.saving.set(false);
        if (this.selected()?.customerId === customer.customerId) {
          form.resetForm({ interactionType: '', summary: '' });
          this.loadTimeline(customer);
        }
      },
      error: (err) => {
        this.saving.set(false);
        if (this.selected()?.customerId === customer.customerId) {
          this.createError.set(this.message('record the interaction', err));
        }
      },
    });
  }

  beginEdit(interaction: Interaction): void {
    this.editingId.set(interaction.id);
    this.editType = interaction.interactionType;
    this.editSummary = interaction.summary;
    this.updateError.set(null);
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.editType = '';
    this.editSummary = '';
    this.updateError.set(null);
  }

  saveEdit(form: NgForm, interaction: Interaction): void {
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

    this.updatingId.set(interaction.id);
    this.interactionApi
      .update(interaction.id, { interactionType: this.editType, summary })
      .subscribe({
        next: (updated) => {
          this.interactions.update((rows) =>
            rows.map((row) => (row.id === updated.id ? updated : row)),
          );
          this.updatingId.set(null);
          this.cancelEdit();
        },
        error: (err) => {
          this.updatingId.set(null);
          this.updateError.set(this.message('update the interaction', err));
        },
      });
  }

  deleteInteraction(interaction: Interaction): void {
    if (this.deletingId() !== null || !window.confirm('Delete this interaction? This cannot be undone.')) {
      return;
    }

    this.deleteError.set(null);
    this.deletingId.set(interaction.id);
    this.interactionApi.delete(interaction.id).subscribe({
      next: () => {
        this.interactions.update((rows) => rows.filter((row) => row.id !== interaction.id));
        this.deletingId.set(null);
      },
      error: (err) => {
        this.deletingId.set(null);
        this.deleteError.set(this.message('delete the interaction', err));
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
