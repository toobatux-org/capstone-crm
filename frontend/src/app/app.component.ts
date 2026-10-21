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

  roleLabel(): string {
    return this.session.isAdmin() ? 'Admin' : 'Agent';
  }

  initials(): string {
    const username = this.session.username()?.trim() ?? '';
    if (!username) {
      return '?';
    }
    const parts = username.split(/[^A-Za-z0-9]+/).filter((part) => part.length > 0);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    const word = parts[0] ?? username;
    const pieces = word.split(/(?=[A-Z])/).filter((part) => part.length > 0);
    if (pieces.length >= 2) {
      return (pieces[0].charAt(0) + pieces[1].charAt(0)).toUpperCase();
    }
    return word.slice(0, 2).toUpperCase();
  }

  openLogoutConfirmation(dialog: HTMLDialogElement): void {
    dialog.showModal();
  }

  logout(dialog: HTMLDialogElement): void {
    dialog.close();
    this.session.logout();
    void this.router.navigate(['/login']);
  }
}
