import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { CustomerCreatePageComponent } from './features/customers/customer-create-page.component';
import { CustomerSearchPageComponent } from './features/customers/customer-search-page.component';
import { InteractionListPageComponent } from './features/interactions/interaction-list-page.component';
import { LoginPageComponent } from './features/login/login-page.component';

export const routes: Routes = [
  { path: 'login', component: LoginPageComponent },
  { path: 'customers', component: CustomerSearchPageComponent, canActivate: [authGuard] },
  { path: 'customers/new', component: CustomerCreatePageComponent, canActivate: [authGuard] },
  { path: 'customers/:publicId', component: InteractionListPageComponent, canActivate: [authGuard] },
  { path: 'interactions', pathMatch: 'full', redirectTo: 'customers' },
  { path: '', pathMatch: 'full', redirectTo: 'customers' },
];
