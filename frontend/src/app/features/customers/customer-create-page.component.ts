import { Component, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CustomerApiService } from './customer-api.service';

@Component({
  selector: 'app-customer-create-page',
  standalone: true,
  imports: [FormsModule, RouterLink],
  host: { class: 'mx-auto block w-full max-w-[38rem]' },
  template: `
    <section>
      <header class="mb-6 flex flex-col items-start gap-2 border-b border-[#d5d9d6] sm:flex-row sm:items-baseline sm:justify-between">
        <h2>New customer</h2>
        <a routerLink="/customers" class="font-semibold text-[#176b54] focus:outline-2 focus:outline-offset-2 focus:outline-[#176b54]">Back to customers</a>
      </header>

      <form #customerForm="ngForm" (ngSubmit)="create(customerForm)" class="grid gap-4" novalidate>
        <div class="grid gap-[0.4rem]">
          <label for="customer-name" class="font-semibold">Full name <span aria-hidden="true">*</span></label>
          <input
            id="customer-name"
            name="fullName"
            class="box-border w-full rounded-[3px] border border-[#87938b] bg-white p-[0.65rem] font-[inherit] text-[#18221b] focus:outline-2 focus:outline-offset-2 focus:outline-[#176b54]"
            [(ngModel)]="fullName"
            #nameControl="ngModel"
            required
            maxlength="200"
            data-testid="customer-name"
            autocomplete="off"
          />
          @if ((nameControl.touched || customerForm.submitted) && !fullName.trim()) {
            <p class="m-0 text-[0.9rem] text-[#9d2929]">Enter the customer's name.</p>
          }
        </div>

        <div class="grid gap-[0.4rem]">
          <label for="customer-status" class="font-semibold">Status <span aria-hidden="true">*</span></label>
          <select
            id="customer-status"
            name="status"
            class="box-border w-full rounded-[3px] border border-[#87938b] bg-white p-[0.65rem] font-[inherit] text-[#18221b] focus:outline-2 focus:outline-offset-2 focus:outline-[#176b54]"
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
            <p class="m-0 text-[0.9rem] text-[#9d2929]">Select a status.</p>
          }
        </div>

        @if (error()) {
          <p class="text-[#9d2929]" role="alert">{{ error() }}</p>
        }

        <button
          type="submit"
          class="justify-self-start cursor-pointer rounded-[3px] border-0 bg-[#176b54] px-4 py-[0.65rem] font-[inherit] font-semibold text-white focus:outline-2 focus:outline-offset-2 focus:outline-[#176b54] disabled:cursor-wait disabled:opacity-[0.65]"
          [disabled]="saving()"
          data-testid="save-customer"
        >
          {{ saving() ? 'Saving...' : 'Save customer' }}
        </button>
      </form>
    </section>
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
