import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthSessionService } from '../../core/auth/auth-session.service';
import { DemoDataService } from '../../core/demo/demo-data.service';
import { Customer } from './customer.model';

@Injectable({ providedIn: 'root' })
export class CustomerApiService {
  private readonly http = inject(HttpClient);
  private readonly session = inject(AuthSessionService);
  private readonly demoData = inject(DemoDataService);
  private readonly base = `${environment.apiBaseUrl}/api/v1/customers`;

  search(query: string): Observable<Customer[]> {
    if (this.session.demoMode()) {
      return this.demoData.searchCustomers(query);
    }
    const params = new HttpParams().set('q', query);
    return this.http.get<Customer[]>(this.base, { params });
  }

  get(customerId: string): Observable<Customer> {
    if (this.session.demoMode()) {
      return this.demoData.getCustomer(customerId);
    }
    return this.http.get<Customer>(`${this.base}/${encodeURIComponent(customerId)}`);
  }
}
