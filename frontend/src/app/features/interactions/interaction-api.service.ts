import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateInteractionRequest, Interaction } from './interaction.model';

@Injectable({ providedIn: 'root' })
export class InteractionApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/v1/interactions`;

  // Builds query string with HttpParams
  list(customerId: string): Observable<Interaction[]> {
   const params = new HttpParams().set("customerId", customerId);
   return this.http.get<Interaction[]>(this.base, { params });
  }

  listAll(): Observable<Interaction[]> {
    return this.http.get<Interaction[]>(this.base);
  }

  // Posts body
  create(body: CreateInteractionRequest): Observable<Interaction> {
    return this.http.post<Interaction>(this.base, body);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${encodeURIComponent(id)}`);
  }
}
