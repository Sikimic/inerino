import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { WalletService } from '../../../shared/wallet.service';
import { BarcodeScanner } from 'nativescript-barcodescanner';
import { RouterExtensions } from 'nativescript-angular/router';
import { Transaction, DBTransction } from '../../../shared/transaction.model';
import * as ethers from 'ethers';
import * as utils from 'utils/utils';
import { TranslateService } from '@ngx-translate/core';
import { ConfigService } from '../../../shared/config.service';

@Component({
    selector: 'Tran',
    moduleId: module.id,
    templateUrl: './transaction.component.html',
    styleUrls: ['./transaction.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class TransactionComponent implements OnInit {
    @Input() transaction: DBTransction;
    @Input() selected: boolean = false;
    @Input() selectionVisible: boolean = false;
    @Input() ethRate: number = 0;
    @Input() pmaRate: number = 1;
    @Input() currencySymbol: string;
    constructor(private translateService: TranslateService, private config: ConfigService, private walletService: WalletService) {

    }

    ngOnInit() {
    }


    get status() {
        let sts = 'transaction.inprogress';
        if (this.transaction && this.transaction.status !== -1) {
            sts = this.transaction.status === 1 ? 'transaction.completed' : 'transaction.failed';
        }

        return this.translateService.get(sts);
    }

    get statusCls(): string {
        if (this.transaction && this.transaction.status !== -1) {
            return this.transaction.status === 1 ? 'completed' : 'failed';
        }
        return 'inprogress';
    }

    get price() {
        if (this.transaction) {
            try {
                return ethers.utils.formatEther(ethers.utils.bigNumberify(this.transaction.value.toString()));
            } catch (err) {
                console.log(err);
                console.log(this.transaction.value);
            }
        }
        return 0;
    }

    get gasfee() {
        if (this.transaction) {
            // console.log(this.transaction.chainTransaction)
            const gasPriceWei = ethers.utils.bigNumberify(this.transaction.gasPrice);
            const gasBN = ethers.utils.bigNumberify(this.transaction.gasUsed);
            return ethers.utils.formatEther(gasPriceWei.mul(gasBN));
        }
        return 0;
    }

    get date() {
        return new Date(Number.parseInt(this.transaction.timeStamp) * 1000);
    }

    get isIncome(): boolean {
        return this.transaction && this.transaction.to === this.walletService.wallet.address.toLowerCase();
    }
    get tran() {
        return this.transaction;
    }

    goToEtherScan() {
        utils.openUrl(this.config.getConf('etherscanTxUrl') + this.transaction.hash);
    }
}
