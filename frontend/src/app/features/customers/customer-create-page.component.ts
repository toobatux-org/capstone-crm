import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CustomerApiService } from './customer-api.service';

@Component({
  selector: 'app-customer-create-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <section class="create-page">
      <header class="page-heading">
        <h2>New customer</h2>
        <a routerLink="/customers">Back to customers</a>
      </header>

      <form #customerForm="ngForm" (ngSubmit)="create(customerForm)" novalidate>
        <div class="field">
          <label for="customer-name">Full name <span aria-hidden="true">*</span></label>
          <input
            id="customer-name"
            name="fullName"
            [(ngModel)]="fullName"
            #nameControl="ngModel"
            required
            maxlength="200"
            data-testid="customer-name"
            autocomplete="off"
          />
          @if ((nameControl.touched || customerForm.submitted) && !fullName.trim()) {
            <p class="field-error">Enter the customer's name.</p>
          }
        </div>

        <div class="field">
          <label for="customer-status">Status <span aria-hidden="true">*</span></label>
          <select
            id="customer-status"
            name="status"
            [(ngModel)]="status"
            #statusControl="ngModel"
            required
            data-testid="customer-status"
          >
            <option value="" disabled>Select a status</option>
            @for (option of statuses; track option) {
              <option [value]="option">{{ option }}</option>
            }
          </select>
          @if ((statusControl.touched || customerForm.submitted) && statusControl.invalid) {
            <p class="field-error">Select a status.</p>
          }
        </div>

        @if (error()) {
          <p class="state-error" role="alert">{{ error() }}</p>
        }

        <button type="submit" [disabled]="saving()" data-testid="save-customer">
          {{ saving() ? 'Saving...' : 'Save customer' }}
        </button>
      </form>
    </section>
  `,
  styles: `
    :host { display: block; max-width: 38rem; }
    .page-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; border-bottom: 1px solid #d5d9d6; margin-bottom: 1.5rem; }
    a { color: #176b54; font-weight: 600; }
    form { display: grid; gap: 1rem; }
    .field { display: grid; gap: 0.4rem; }
    label { font-weight: 600; }
    input, select { box-sizing: border-box; width: 100%; border: 1px solid #87938b; border-radius: 3px; padding: 0.65rem; font: inherit; background: #fff; color: #18221b; }
    input:focus, select:focus, button:focus-visible, a:focus-visible { outline: 2px solid #176b54; outline-offset: 2px; }
    .field-error, .state-error { color: #9d2929; margin: 0; }
    button { justify-self: start; border: 0; border-radius: 3px; padding: 0.65rem 1rem; background: #176b54; color: #fff; font: inherit; font-weight: 600; cursor: pointer; }
    button:disabled { cursor: wait; opacity: 0.65; }
  `,
})
export class CustomerCreatePageComponent {
  private readonly api = inject(CustomerApiService);
  private readonly router = inject(Router);

  readonly statuses = ['PROSPECT', 'ACTIVE', 'CLOSED'];
  fullName = '';
  status = 'PROSPECT';
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  create(form: NgForm): void {
    this.error.set(null);
    if (form.invalid || !this.fullName.trim() || this.saving()) {
      form.control.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.api.create({ fullName: this.fullName.trim(), status: this.status }).subscribe({
      next: (customer) => {
        this.saving.set(false);
        void this.router.navigate(['/customers', customer.publicId]);
      },
      error: (err: { status?: number }) => {
        this.saving.set(false);
        if (err.status === 401) {
          this.error.set('Your session expired. Sign in again.');
          return;
        }
        if (err.status === 400) {
          this.error.set('Enter a name and a valid status.');
          return;
        }
        this.error.set('Could not save the customer. Check your connection and try again.');
      },
    });
  }
}
