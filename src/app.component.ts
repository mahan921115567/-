
import { Component, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TradeComponent } from './components/trade/trade.component';
import { WalletComponent } from './components/wallet/wallet.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { AuthService } from './services/auth.service';
import { WelcomeComponent } from './components/welcome/welcome.component';
import { PriceListComponent } from './components/prices/price-list.component';
import { AdminPanelComponent } from './components/admin/admin-panel.component';
import { LandingComponent } from './components/landing/landing.component';
import { HistoryComponent } from './components/history/history.component';
import { NotificationsComponent } from './components/notifications/notifications.component';
import { ThemeService } from './services/theme.service';

type View = 'prices' | 'buy' | 'sell' | 'wallet' | 'history';
type AuthView = 'login' | 'register';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TradeComponent, WalletComponent, LoginComponent, RegisterComponent, WelcomeComponent, PriceListComponent, AdminPanelComponent, LandingComponent, HistoryComponent, NotificationsComponent],
})
export class AppComponent {
  private authService = inject(AuthService);
  themeService = inject(ThemeService); // Made public for template access
  
  currentView = signal<View>('prices');
  authView = signal<AuthView>('login');
  showLanding = signal<boolean>(true); // Show landing by default
  
  currentUser = this.authService.currentUser;
  isNewUser = this.authService.isNewUser;
  isAdmin = this.authService.isAdmin;

  constructor() {
    this.authService.checkSession();
    // If user is already logged in, skip landing
    if (this.currentUser()) {
        this.showLanding.set(false);
    }
  }

  enterApp() {
    this.showLanding.set(false);
  }

  setView(view: View) {
    this.currentView.set(view);
  }

  setAuthView(view: AuthView) {
    this.authView.set(view);
  }

  logout() {
    this.authService.logout();
    this.currentView.set('prices'); 
    this.showLanding.set(true); // Return to landing on logout
  }

  dismissWelcome() {
    this.authService.dismissNewUserWelcome();
  }
}
