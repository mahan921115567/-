
import { Component, ChangeDetectionStrategy, signal, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CaptchaComponent } from '../captcha/captcha.component';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, CaptchaComponent],
})
export class RegisterComponent {
  private authService = inject(AuthService);
  registerSuccess = output<void>();

  username = signal('');
  password = signal('');
  isCaptchaVerified = signal(false);
  status = signal<{ success: boolean; message: string } | null>(null);

  onCaptchaVerify(verified: boolean) {
    this.isCaptchaVerified.set(verified);
  }

  handleRegister() {
    if (!this.username() || !this.password()) {
      this.status.set({ success: false, message: 'نام کاربری و رمز عبور نمی‌توانند خالی باشند.' });
      return;
    }

    if (!this.isCaptchaVerified()) {
      this.status.set({ success: false, message: 'لطفاً برای ادامه کپچا را حل کنید.' });
      return;
    }

    const result = this.authService.register({
      username: this.username(),
      password: this.password()
    });

    this.status.set(result);

    if (result.success) {
      // Delay slightly to let user see success message before switching view
      setTimeout(() => {
        this.registerSuccess.emit();
      }, 1500);
    }
  }
}
