import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateCustomerRequest, Customer, CustomerPage } from './customer.model';

@Injectable({ providedIn: 'root' })
export class CustomerApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/v1/customers`;

  search(query: string, page: number, size: number): Observable<CustomerPage> {
    const params = new HttpParams()
      .set('q', query)
      .set('page', page)
      .set('size', size);
    return this.http.get<CustomerPage>(this.base, { params });
  }

  create(body: CreateCustomerRequest): Observable<Customer> {
    return this.http.post<Customer>(this.base, body);
  }

  get(publicId: string): Observable<Customer> {
    return this.http.get<Customer>(`${this.base}/${encodeURIComponent(publicId)}`);
  }
}
