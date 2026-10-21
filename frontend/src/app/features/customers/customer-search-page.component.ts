import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CustomerApiService } from './customer-api.service';
import { Customer } from './customer.model';

@Component({
  selector: 'app-customer-search-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  host: { class: 'block w-full' },
  template: `
    <section>
      <header class="mb-6 flex flex-col items-start gap-3 border-b border-[#d5d9d6] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="mb-1">Customers</h2>
          <p class="mt-0 text-[#59645d]">Search by name or customer id.</p>
        </div>
        <a
          routerLink="/customers/new"
          class="shrink-0 rounded-[3px] bg-[#176b54] px-4 py-[0.65rem] font-semibold text-white no-underline focus:outline-2 focus:outline-offset-2 focus:outline-[#176b54]"
          data-testid="new-customer"
        >New customer</a>
      </header>

      <form (ngSubmit)="search()" class="mb-6 flex items-end gap-3 max-[36rem]:flex-col max-[36rem]:items-stretch" novalidate>
        <div class="grid flex-1 gap-[0.4rem]">
          <label for="customer-query" class="font-semibold">Name or id</label>
          <input
            id="customer-query"
            name="query"
            class="box-border w-full rounded-[3px] border border-[#87938b] bg-white p-[0.65rem] font-[inherit] text-[#18221b] focus:outline-2 focus:outline-offset-2 focus:outline-[#176b54]"
            [(ngModel)]="query"
            data-testid="customer-search"
            autocomplete="off"
          />
        </div>
        <button
          type="submit"
          class="cursor-pointer rounded-[3px] border-0 bg-[#176b54] px-4 py-[0.65rem] font-[inherit] font-semibold text-white focus:outline-2 focus:outline-offset-2 focus:outline-[#176b54] disabled:cursor-wait disabled:opacity-[0.65]"
          [disabled]="loading()"
          data-testid="search"
        >
          {{ loading() ? 'Searching...' : 'Search' }}
        </button>
      </form>

      @if (error()) {
        <p class="text-[#9d2929]" role="alert">{{ error() }}</p>
      } @else if (loading() && rows().length === 0) {
        <p class="text-[#59645d]" role="status">Loading customers...</p>
      } @else if (searched() && totalElements() === 0) {
        <p class="text-[#9d2929]" role="alert" data-testid="customer-not-found">Customer not found.</p>
      } @else if (totalElements() === 0) {
        <p class="text-[#59645d]">No customers yet.</p>
      } @else {
        <table class="stack-table w-full border-collapse">
          <caption class="sr-only">Customers</caption>
          <thead>
            <tr>
              <th scope="col" class="border-b border-[#e1e5e2] px-2 py-[0.85rem] text-left text-sm font-semibold text-[#59645d]">Name</th>
              <th scope="col" class="border-b border-[#e1e5e2] px-2 py-[0.85rem] text-left text-sm font-semibold text-[#59645d]">Customer id</th>
              <th scope="col" class="border-b border-[#e1e5e2] px-2 py-[0.85rem] text-left text-sm font-semibold text-[#59645d]">Status</th>
            </tr>
          </thead>
          <tbody>
            @for (customer of rows(); track customer.publicId) {
              <tr data-testid="customer-row">
                <td class="border-b border-[#e1e5e2] px-2 py-[0.85rem] break-words" data-label="Name">
                  <a
                    [routerLink]="['/customers', customer.publicId]"
                    class="font-semibold text-[#176b54] focus:outline-2 focus:outline-offset-2 focus:outline-[#176b54]"
                    data-testid="customer-result"
                  >
                    {{ customer.fullName }}
                  </a>
                </td>
                <td class="border-b border-[#e1e5e2] px-2 py-[0.85rem]" data-label="Customer id">{{ customer.publicId }}</td>
                <td class="border-b border-[#e1e5e2] px-2 py-[0.85rem]" data-label="Status">{{ customer.status }}</td>
              </tr>
            }
          </tbody>
        </table>

        <nav class="mt-4 flex flex-wrap items-center justify-between gap-3" aria-label="Customer pages">
          <button
            type="button"
            class="cursor-pointer rounded-[3px] border border-[#176b54] bg-white px-4 py-[0.65rem] font-[inherit] font-semibold text-[#176b54] focus:outline-2 focus:outline-offset-2 focus:outline-[#176b54] disabled:cursor-not-allowed disabled:opacity-[0.65]"
            (click)="go(page() - 1)"
            [disabled]="loading() || page() === 0"
            data-testid="previous-page"
          >
            Previous
          </button>
          <span role="status">Page {{ page() + 1 }} of {{ totalPages() }}</span>
          <button
            type="button"
            class="cursor-pointer rounded-[3px] border border-[#176b54] bg-white px-4 py-[0.65rem] font-[inherit] font-semibold text-[#176b54] focus:outline-2 focus:outline-offset-2 focus:outline-[#176b54] disabled:cursor-not-allowed disabled:opacity-[0.65]"
            (click)="go(page() + 1)"
            [disabled]="loading() || page() + 1 >= totalPages()"
            data-testid="next-page"
          >
            Next
          </button>
        </nav>
      }
    </section>
  `,
})
export class CustomerSearchPageComponent {
  private readonly api = inject(CustomerApiService);
  private readonly pageSize = 10;

  query = '';
  readonly rows = signal<Customer[]>([]);
  readonly page = signal(0);
  readonly totalPages = signal(0);
  readonly totalElements = signal(0);
  readonly loading = signal(false);
  readonly searched = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    this.load(0);
  }

  search(): void {
    this.searched.set(this.query.trim().length > 0);
    this.load(0);
  }

  go(page: number): void {
    this.load(page);
  }

  private load(page: number): void {
    this.error.set(null);
    this.loading.set(true);
    this.api.search(this.query.trim(), page, this.pageSize).subscribe({
      next: (result) => {
        this.rows.set(result.content);
        this.page.set(result.page);
        this.totalPages.set(result.totalPages);
        this.totalElements.set(result.totalElements);
        this.loading.set(false);
      },
      error: (err: { status?: number }) => {
        this.loading.set(false);
        this.rows.set([]);
        this.totalElements.set(0);
        this.totalPages.set(0);
        if (err.status === 401) {
          this.error.set('Your session expired. Sign in again.');
          return;
        }
        this.error.set('Could not search customers. Check your connection and try again.');
      },
    });
  }
}
