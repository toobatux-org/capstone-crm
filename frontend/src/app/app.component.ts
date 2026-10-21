import { Component, inject } from '@angular/core';
import { IsActiveMatchOptions, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthSessionService } from './core/auth/auth-session.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  readonly session = inject(AuthSessionService);
  private readonly router = inject(Router);
  readonly exactMatch: IsActiveMatchOptions = {
    paths: 'exact',
    queryParams: 'ignored',
    matrixParams: 'ignored',
    fragment: 'ignored',
  };

  openLogoutConfirmation(dialog: HTMLDialogElement): void {
    dialog.showModal();
  }

  logout(dialog: HTMLDialogElement): void {
    dialog.close();
    this.session.logout();
    void this.router.navigate(['/login']);
  }
}
