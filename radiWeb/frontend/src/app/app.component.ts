import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { NotificationService } from './core/services/notification.service';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet],
    template: `<router-outlet />`,
    styles: []
})
export class AppComponent implements OnInit {
  constructor(
    private readonly auth: AuthService,
    private readonly notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) {
      this.notificationService.startPolling();
    }
  }
}
