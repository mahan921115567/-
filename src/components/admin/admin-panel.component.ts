
import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CryptoService } from '../../services/crypto.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { DepositInfo, Cryptocurrency, DepositRequest, TomanDepositInfo, ExchangeConfig } from '../../models/crypto.model';

type AdminView = 'transactions' | 'deposits' | 'toman_requests' | 'settings' | 'broadcast';

@Component({
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
})
export class AdminPanelComponent {
  private cryptoService = inject(CryptoService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  currentView = signal<AdminView>('transactions');
  
  allTransactions = this.cryptoService.allTransactions;
  allDepositRequests = this.cryptoService.allDepositRequests;
  allTomanRequests = this.cryptoService.allTomanRequests;
  cryptos = this.cryptoService.cryptos;
  
  depositInfosForm = signal<{ [key: string]: DepositInfo }>({});
  tomanDepositInfoForm = signal<TomanDepositInfo>({ cardNumber: '', shabaNumber: '', usdtWalletAddress: '' });
  
  exchangeConfigForm = signal<ExchangeConfig>({ priceMode: 'manual', manualUsdtPrice: 0 });

  // Broadcast
  broadcastTitle = signal('');
  broadcastMessage = signal('');
  broadcastStatus = signal('');

  // Lock Screen Logic
  isLocked = signal<boolean>(false);
  enteredPin = signal<string>('');
  lockMessage = signal<string>('');

  constructor() {
    this.depositInfosForm.set(JSON.parse(JSON.stringify(this.cryptoService.depositInfo())));
    this.tomanDepositInfoForm.set(JSON.parse(JSON.stringify(this.cryptoService.tomanDepositInfo())));
    this.exchangeConfigForm.set(JSON.parse(JSON.stringify(this.cryptoService.exchangeConfig())));

    // Check if lock is enabled
    if (this.exchangeConfigForm().adminPin) {
      this.isLocked.set(true);
    }
  }

  unlockApp() {
    const config = this.cryptoService.exchangeConfig();
    if (config.adminPin === this.enteredPin()) {
      this.isLocked.set(false);
      this.lockMessage.set('');
      this.enteredPin.set('');
    } else {
      this.lockMessage.set('رمز اشتباه است.');
    }
  }

  private cryptoMap = computed(() => new Map(this.cryptos().map(c => [c.id, c])));

  pendingTransactions = computed(() => {
    const map = this.cryptoMap();
    return this.allTransactions().filter(tx => tx.status === 'pending')
      .map(tx => ({ ...tx, cryptoSymbol: map.get(tx.cryptoId)?.symbol ?? '???' }))
      .sort((a, b) => b.timestamp - a.timestamp);
  });

  completedTransactions = computed(() => {
    const map = this.cryptoMap();
    return this.allTransactions().filter(tx => tx.status !== 'pending')
      .map(tx => ({ ...tx, cryptoSymbol: map.get(tx.cryptoId)?.symbol ?? '???' }))
      .sort((a, b) => b.timestamp - a.timestamp);
  });
  
  pendingDepositRequests = computed(() => {
    const map = this.cryptoMap();
    return this.allDepositRequests().filter(req => req.status === 'pending')
      .map(req => ({ ...req, cryptoSymbol: map.get(req.cryptoId)?.symbol ?? '???' }))
      .sort((a, b) => b.timestamp - a.timestamp);
  });

  completedDepositRequests = computed(() => {
    const map = this.cryptoMap();
    return this.allDepositRequests().filter(req => req.status !== 'pending')
      .map(req => ({ ...req, cryptoSymbol: map.get(req.cryptoId)?.symbol ?? '???' }))
      .sort((a, b) => b.timestamp - a.timestamp);
  });

  pendingTomanRequests = computed(() => {
    return this.allTomanRequests()
      .filter(req => req.status === 'pending')
      .sort((a, b) => b.timestamp - a.timestamp);
  });

  completedTomanRequests = computed(() => {
    return this.allTomanRequests()
      .filter(req => req.status !== 'pending')
      .sort((a, b) => b.timestamp - a.timestamp);
  });

  approve(txId: string) { this.cryptoService.approveTransaction(txId); }
  reject(txId: string) { this.cryptoService.rejectTransaction(txId); }
  approveDeposit(reqId: string) { this.cryptoService.approveDepositRequest(reqId); }
  rejectDeposit(reqId: string) { this.cryptoService.rejectDepositRequest(reqId); }
  approveToman(reqId: string) { this.cryptoService.approveTomanRequest(reqId); }
  rejectToman(reqId: string) { this.cryptoService.rejectTomanRequest(reqId); }

  saveDepositInfo(cryptoId: string) {
    const info = this.depositInfosForm()[cryptoId];
    if (info) this.cryptoService.updateDepositInfo(cryptoId, info);
  }

  saveTomanDepositInfo() {
    this.cryptoService.updateTomanDepositInfo(this.tomanDepositInfoForm());
    alert('تنظیمات واریز تومان ذخیره شد.');
  }

  saveExchangeConfig() {
    this.cryptoService.saveExchangeConfig(this.exchangeConfigForm());
    alert('تنظیمات صرافی (نرخ دلار و امنیت) با موفقیت ذخیره شد.');
  }

  backupData() {
    this.cryptoService.exportData();
  }

  triggerRestore() {
    document.getElementById('restoreInput')?.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.cryptoService.importData(input.files[0]).then(res => {
        alert(res.message);
      });
    }
  }

  sendBroadcast() {
      if(!this.broadcastTitle() || !this.broadcastMessage()) {
          this.broadcastStatus.set('لطفا عنوان و متن پیام را وارد کنید.');
          return;
      }
      
      this.notificationService.addNotification('all', this.broadcastTitle(), this.broadcastMessage(), 'info');
      this.broadcastTitle.set('');
      this.broadcastMessage.set('');
      this.broadcastStatus.set('پیام با موفقیت برای تمام کاربران ارسال شد.');
      setTimeout(() => this.broadcastStatus.set(''), 3000);
  }

  logout() { this.authService.logout(); }
}
