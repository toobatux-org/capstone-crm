import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { Customer } from '../../features/customers/customer.model';
import {
  CreateInteractionRequest,
  Interaction,
  UpdateInteractionRequest,
} from '../../features/interactions/interaction.model';

@Injectable({ providedIn: 'root' })
export class DemoDataService {
  private readonly customers: Customer[] = [
    {
      customerId: 'CUS-1001',
      fullName: 'Amina Khan',
      status: 'ACTIVE',
      createdAt: '2025-01-15T10:00:00Z',
    },
    {
      customerId: 'CUS-1002',
      fullName: 'Ravi Singh',
      status: 'PROSPECT',
      createdAt: '2025-03-22T14:30:00Z',
    },
    {
      customerId: 'CUS-1003',
      fullName: 'Maya Chen',
      status: 'ACTIVE',
      createdAt: '2025-06-08T09:15:00Z',
    },
  ];

  private interactions: Interaction[] = [
    {
      id: 'demo-interaction-1',
      customerId: 'CUS-1001',
      interactionType: 'CALL',
      summary: 'Discussed renewal options and agreed to follow up next week.',
      correlationId: 'local-demo',
      createdAt: '2026-10-18T15:30:00Z',
    },
    {
      id: 'demo-interaction-2',
      customerId: 'CUS-1001',
      interactionType: 'EMAIL',
      summary: 'Sent the updated service proposal for review.',
      correlationId: 'local-demo',
      createdAt: '2026-10-16T11:00:00Z',
    },
    {
      id: 'demo-interaction-3',
      customerId: 'CUS-1002',
      interactionType: 'MEETING',
      summary: 'Initial discovery meeting; customer is evaluating options.',
      correlationId: 'local-demo',
      createdAt: '2026-10-14T09:00:00Z',
    },
  ];

  searchCustomers(query: string): Observable<Customer[]> {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const results = this.customers.filter(
      (customer) =>
        customer.customerId.toLocaleLowerCase().includes(normalizedQuery) ||
        customer.fullName.toLocaleLowerCase().includes(normalizedQuery),
    );
    return of(results.map((customer) => ({ ...customer })));
  }

  getCustomer(customerId: string): Observable<Customer> {
    const customer = this.customers.find((item) => item.customerId === customerId);
    return customer
      ? of({ ...customer })
      : throwError(() => new Error(`Customer ${customerId} was not found in demo data.`));
  }

  listInteractions(customerId: string): Observable<Interaction[]> {
    return of(
      this.interactions
        .filter((interaction) => interaction.customerId === customerId)
        .sort((first, second) => second.createdAt.localeCompare(first.createdAt))
        .map((interaction) => ({ ...interaction })),
    );
  }

  listAllInteractions(): Observable<Interaction[]> {
    return of(
      [...this.interactions]
        .sort((first, second) => second.createdAt.localeCompare(first.createdAt))
        .map((interaction) => ({ ...interaction })),
    );
  }

  createInteraction(request: CreateInteractionRequest): Observable<Interaction> {
    const customer = this.customers.find((item) => item.customerId === request.customerId);
    if (!customer) {
      return throwError(() => new Error(`Customer ${request.customerId} was not found in demo data.`));
    }

    const interaction: Interaction = {
      id: crypto.randomUUID(),
      customerId: request.customerId,
      interactionType: request.interactionType,
      summary: request.summary,
      correlationId: request.correlationId ?? 'local-demo',
      createdAt: new Date().toISOString(),
    };
    this.interactions = [interaction, ...this.interactions];
    return of({ ...interaction });
  }

  updateInteraction(id: string, request: UpdateInteractionRequest): Observable<Interaction> {
    const existing = this.interactions.find((interaction) => interaction.id === id);
    if (!existing) {
      return throwError(() => new Error(`Interaction ${id} was not found in demo data.`));
    }

    const updated = {
      ...existing,
      interactionType: request.interactionType,
      summary: request.summary,
    };
    this.interactions = this.interactions.map((interaction) =>
      interaction.id === id ? updated : interaction,
    );
    return of({ ...updated });
  }

  deleteInteraction(id: string): Observable<void> {
    const exists = this.interactions.some((interaction) => interaction.id === id);
    if (!exists) {
      return throwError(() => new Error(`Interaction ${id} was not found in demo data.`));
    }
    this.interactions = this.interactions.filter((interaction) => interaction.id !== id);
    return of(void 0);
  }
}
