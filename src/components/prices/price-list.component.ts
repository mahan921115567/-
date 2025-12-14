
import { Component, ChangeDetectionStrategy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CryptoService } from '../../services/crypto.service';
import { DomSanitizer } from '@angular/platform-browser';
import { PriceChartComponent } from './price-chart.component';

type SortOrder = 'default' | 'gainers' | 'losers';

@Component({
  selector: 'app-price-list',
  templateUrl: './price-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, PriceChartComponent],
})
export class PriceListComponent {
  private cryptoService = inject(CryptoService);
  private sanitizer = inject(DomSanitizer);

  cryptos = this.cryptoService.cryptos;
  sortOrder = signal<SortOrder>('default');

  setSort(order: SortOrder) {
    this.sortOrder.set(order);
  }

  enrichedCryptos = computed(() => {
    let list = this.cryptos().map(crypto => ({
      ...crypto,
      sanitizedLogo: this.sanitizer.bypassSecurityTrustHtml(crypto.logo)
    }));

    const order = this.sortOrder();
    if (order === 'gainers') {
      list = list.sort((a, b) => (b.change24h || 0) - (a.change24h || 0));
    } else if (order === 'losers') {
      list = list.sort((a, b) => (a.change24h || 0) - (b.change24h || 0));
    }
    
    return list;
  });
}
