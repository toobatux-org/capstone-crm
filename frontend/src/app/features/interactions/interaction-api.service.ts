import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthSessionService } from '../../core/auth/auth-session.service';
import { DemoDataService } from '../../core/demo/demo-data.service';
import {
  CreateInteractionRequest,
  Interaction,
  UpdateInteractionRequest,
} from './interaction.model';

@Injectable({ providedIn: 'root' })
export class InteractionApiService {
  private readonly http = inject(HttpClient);
  private readonly session = inject(AuthSessionService);
  private readonly demoData = inject(DemoDataService);
  private readonly base = `${environment.apiBaseUrl}/api/v1/interactions`;

  // Builds query string with HttpParams
  list(customerId: string): Observable<Interaction[]> {
    if (this.session.demoMode()) {
      return this.demoData.listInteractions(customerId);
    }
   const params = new HttpParams().set("customerId", customerId);
   return this.http.get<Interaction[]>(this.base, { params });
  }

  listAll(): Observable<Interaction[]> {
    if (this.session.demoMode()) {
      return this.demoData.listAllInteractions();
    }
    return this.http.get<Interaction[]>(this.base);
  }

  // Posts body
  create(body: CreateInteractionRequest): Observable<Interaction> {
    if (this.session.demoMode()) {
      return this.demoData.createInteraction(body);
    }
    return this.http.post<Interaction>(this.base, body);
  }

  update(id: string, body: UpdateInteractionRequest): Observable<Interaction> {
    if (this.session.demoMode()) {
      return this.demoData.updateInteraction(id, body);
    }
    return this.http.put<Interaction>(`${this.base}/${encodeURIComponent(id)}`, body);
  }

  delete(id: string): Observable<void> {
    if (this.session.demoMode()) {
      return this.demoData.deleteInteraction(id);
    }
    return this.http.delete<void>(`${this.base}/${encodeURIComponent(id)}`);
  }
}
