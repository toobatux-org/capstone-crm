import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CustomerApiService } from './customer-api.service';
import { Customer } from './customer.model';

@Component({
  selector: 'app-customer-search-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <section class="search-page">
      <header class="page-heading">
        <div>
          <h2>Customers</h2>
          <p>Search by name or customer id.</p>
        </div>
        <a routerLink="/customers/new" class="action" data-testid="new-customer">New customer</a>
      </header>

      <form (ngSubmit)="search()" novalidate>
        <div class="field">
          <label for="customer-query">Name or id</label>
          <input
            id="customer-query"
            name="query"
            [(ngModel)]="query"
            data-testid="customer-search"
            autocomplete="off"
          />
        </div>
        <button type="submit" [disabled]="loading()" data-testid="search">
          {{ loading() ? 'Searching...' : 'Search' }}
        </button>
      </form>

      @if (error()) {
        <p class="state-error" role="alert">{{ error() }}</p>
      } @else if (loading() && rows().length === 0) {
        <p class="state-message" role="status">Loading customers...</p>
      } @else if (searched() && totalElements() === 0) {
        <p class="state-error" role="alert" data-testid="customer-not-found">Customer not found.</p>
      } @else if (totalElements() === 0) {
        <p class="state-message">No customers yet.</p>
      } @else {
        <table>
          <caption class="visually-hidden">Customers</caption>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Customer id</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            @for (customer of rows(); track customer.publicId) {
              <tr data-testid="customer-row">
                <td>
                  <a [routerLink]="['/customers', customer.publicId]" data-testid="customer-result">
                    {{ customer.fullName }}
                  </a>
                </td>
                <td>{{ customer.publicId }}</td>
                <td>{{ customer.status }}</td>
              </tr>
            }
          </tbody>
        </table>

        <nav class="pager" aria-label="Customer pages">
          <button type="button" (click)="go(page() - 1)" [disabled]="loading() || page() === 0" data-testid="previous-page">
            Previous
          </button>
          <span role="status">Page {{ page() + 1 }} of {{ totalPages() }}</span>
          <button
            type="button"
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
  styles: `
    :host { display: block; max-width: 54rem; }
    .page-heading { display: flex; align-items: center; justify-content: space-between; gap: 1rem; border-bottom: 1px solid #d5d9d6; margin-bottom: 1.5rem; }
    a.action { border-radius: 3px; padding: 0.65rem 1rem; background: #176b54; color: #fff; text-decoration: none; }
    .page-heading p, .state-message, caption { color: #59645d; }
    form { display: flex; gap: 0.75rem; align-items: end; margin-bottom: 1.5rem; }
    .field { display: grid; gap: 0.4rem; flex: 1; }
    label { font-weight: 600; }
    input { box-sizing: border-box; width: 100%; border: 1px solid #87938b; border-radius: 3px; padding: 0.65rem; font: inherit; background: #fff; color: #18221b; }
    input:focus, button:focus-visible, a:focus-visible { outline: 2px solid #176b54; outline-offset: 2px; }
    button { border: 0; border-radius: 3px; padding: 0.65rem 1rem; background: #176b54; color: #fff; font: inherit; font-weight: 600; cursor: pointer; }
    button:disabled { cursor: not-allowed; opacity: 0.65; }
    .state-error { color: #9d2929; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; border-bottom: 1px solid #e1e5e2; padding: 0.85rem 0.5rem; }
    th { color: #59645d; font-size: 0.85rem; font-weight: 600; }
    a { color: #176b54; font-weight: 600; }
    .pager { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-top: 1rem; }
    .pager button { background: #fff; color: #176b54; border: 1px solid #176b54; }
    .visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); border: 0; }
    @media (max-width: 36rem) { form { flex-direction: column; align-items: stretch; } }
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
