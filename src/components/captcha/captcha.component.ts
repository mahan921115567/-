
import { Component, ChangeDetectionStrategy, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-captcha',
  templateUrl: './captcha.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class CaptchaComponent {
  verified = output<boolean>();

  state = signal<'unchecked' | 'loading' | 'checked'>('unchecked');

  verify() {
    if (this.state() !== 'unchecked') return;

    this.state.set('loading');
    
    // Simulate network delay for verification
    setTimeout(() => {
      this.state.set('checked');
      this.verified.emit(true);
    }, 1500);
  }
}
