
import { Injectable, signal, inject } from '@angular/core';
import { User } from '../models/user.model';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly USERS_KEY = 'crypto_users';
  private readonly SESSION_KEY = 'crypto_session_user';
  private readonly NEW_USER_KEY = 'crypto_new_user';

  private notificationService = inject(NotificationService);

  currentUser = signal<User | null>(null);
  isNewUser = signal<boolean>(false);
  isAdmin = signal<boolean>(false);

  // 2FA Temporary State
  private pendingUser: User | null = null;
  private currentOtp: string | null = null;

  constructor() {
    this.ensureAdminExists();
  }

  checkSession() {
    try {
      const sessionUserJson = localStorage.getItem(this.SESSION_KEY);
      if (sessionUserJson) {
        const user: User = JSON.parse(sessionUserJson);
        this.currentUser.set(user);
        if (user.username === 'admin') {
          this.isAdmin.set(true);
        }
      }
    } catch (e) {
      console.error('Failed to parse session user from localStorage', e);
      localStorage.removeItem(this.SESSION_KEY);
    }
  }

  // Step 1: Check Username/Password
  validateCredentials(credentials: Omit<User, 'email'>): { status: 'success' | '2fa_required' | 'fail'; message: string } {
    const users = this.getUsers();
    const user = users.find(u => u.username === credentials.username);

    if (user && user.password === credentials.password) {
      if (user.twoFactorEnabled) {
        this.pendingUser = user;
        return { status: '2fa_required', message: 'اطلاعات صحیح است. لطفاً کد تایید را وارد کنید.' };
      }

      this.finalizeLogin(user);
      return { status: 'success', message: 'ورود با موفقیت انجام شد.' };
    }
    return { status: 'fail', message: 'نام کاربری یا رمز عبور اشتباه است.' };
  }

  // Step 2: Generate OTP (Simulated)
  generateTwoFactorCode(): string {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.currentOtp = code;
    // Notify user via "SMS" (System notification in this demo context)
    if (this.pendingUser) {
        // We can't use main notification system easily here because user isn't logged in yet to see it in the panel, 
        // but let's log it for consistency or rely on the UI toast we built earlier.
        console.log(`[DEV ONLY] 2FA Code for ${this.pendingUser?.username}: ${code}`);
    }
    return code;
  }

  // Step 3: Verify OTP and Login
  verifyTwoFactor(code: string): { success: boolean; message: string } {
    if (!this.pendingUser || !this.currentOtp) {
      return { success: false, message: 'خطا در نشست. لطفاً مجدداً تلاش کنید.' };
    }

    if (code === this.currentOtp) {
      this.finalizeLogin(this.pendingUser);
      this.pendingUser = null;
      this.currentOtp = null;
      return { success: true, message: 'ورود با موفقیت انجام شد.' };
    }

    return { success: false, message: 'کد وارد شده صحیح نیست.' };
  }

  private finalizeLogin(user: User) {
    this.currentUser.set(user);
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
    
    // Trigger Notification
    this.notificationService.addNotification(
        user.username, 
        'ورود موفق', 
        `خوش آمدید! شما در تاریخ ${new Date().toLocaleTimeString('fa-IR')} وارد حساب کاربری شدید.`, 
        'success'
    );
    
    if (user.username === 'admin') {
      this.isAdmin.set(true);
    } else {
      const isNew = sessionStorage.getItem(this.NEW_USER_KEY);
      if (isNew === 'true') {
        this.isNewUser.set(true);
      }
    }
  }

  register(newUser: User): { success: boolean; message: string } {
    if (!newUser.username || !newUser.password) {
        return { success: false, message: 'نام کاربری و رمز عبور نمی‌توانند خالی باشند.' };
    }
    if (newUser.username === 'admin') {
        return { success: false, message: 'این نام کاربری غیرمجاز است.' };
    }

    const users = this.getUsers();
    if (users.some(u => u.username === newUser.username)) {
      return { success: false, message: 'این نام کاربری قبلاً استفاده شده است.' };
    }

    const userToSave: User = {
      ...newUser,
      twoFactorEnabled: true
    };

    users.push(userToSave);
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    sessionStorage.setItem(this.NEW_USER_KEY, 'true'); 
    
    // Notification will be seen when they login
    this.notificationService.addNotification(
        newUser.username,
        'خوش آمدید',
        'حساب کاربری شما با موفقیت ایجاد شد.',
        'success'
    );

    return { success: true, message: 'ثبت‌نام با موفقیت انجام شد! اکنون می‌توانید وارد شوید.' };
  }

  logout() {
    localStorage.removeItem(this.SESSION_KEY);
    this.currentUser.set(null);
    this.isNewUser.set(false);
    this.isAdmin.set(false);
    this.pendingUser = null;
    this.currentOtp = null;
    sessionStorage.removeItem(this.NEW_USER_KEY);
  }

  dismissNewUserWelcome() {
    this.isNewUser.set(false);
    sessionStorage.removeItem(this.NEW_USER_KEY);
  }

  private getUsers(): User[] {
    try {
      const usersJson = localStorage.getItem(this.USERS_KEY);
      return usersJson ? JSON.parse(usersJson) : [];
    } catch (e) {
      console.error('Failed to parse users from localStorage', e);
      return [];
    }
  }

  private ensureAdminExists() {
    const users = this.getUsers();
    if (!users.some(u => u.username === 'admin')) {
      users.push({ username: 'admin', password: 'admin', twoFactorEnabled: true });
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    }
  }
}
