import { Component, OnInit, OnDestroy } from '@angular/core';
import { PageRoute, RouterExtensions } from 'nativescript-angular/router';
import { Page, EventData } from 'ui/page';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/observable/interval';
import { Transaction, TransactionStatus, TransactionType, DBTransction } from '../../../shared/transaction.model';
import * as ethers from 'ethers';
import { WalletService } from '../../../shared/wallet.service';
import { TextField } from 'ui/text-field';
import { Observable } from 'rxjs/Observable';
import * as dialogs from 'ui/dialogs';
import { BarcodeScanner } from 'nativescript-barcodescanner';
import * as blockies from 'ethereum-blockies-png';
import { TranslateService } from '@ngx-translate/core';
import { SettingsService } from '../../../shared/settings.service';
import { ToastMsg } from '../../../shared/toast.service';
import * as moment from 'moment';
import { Subscription } from 'rxjs/Subscription';
import { ConfigService } from '../../../shared/config.service';


@Component({
    selector: 'TransactionPreview',
    moduleId: module.id,
    templateUrl: './transaction-preview.component.html',
    styleUrls: ['./transaction-preview.component.css']
})

export class TransactionPreviewComponent implements OnInit, OnDestroy {


    tran: string;
    transaction: Transaction;
    gas: number = 300000;
    gasPrice: string = '21';
    transactionInProgerss: boolean = false;
    isFailed: boolean = false;
    transactionResult: boolean = false;
    transactionSub: Observable<any>;
    isValidTransaction: boolean = false;
    ethRate: number = 0;
    pmaRate: number = 1;
    showExplain: boolean = false;
    errorTxt: string = '';
    tokenBalance: number = 0;
    balance: number = 0;

    currencySymbol: string;
    tip: boolean = false;
    // tslint:disable-next-line:max-line-length
    avatar: string = 'data:image/jpeg;base64,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';

    expireIndication: string;
    isExpired: boolean = false;
    isExpiring: boolean = false;
    endTime: any;
    timerSub: Subscription;
    showInvalidAmmount: boolean = false;
    showIvalidGas: boolean = false;

    isTransactionDataLoaded: boolean = false;
    constructor(private walletService: WalletService, private pageRoute: PageRoute,
        private page: Page,
        private config: ConfigService,
        private routerExtensions: RouterExtensions,
        private settingsService: SettingsService,
        private translateService: TranslateService) {

        this.translateService.get(`strings.symbols.${this.settingsService.currency}`).subscribe(t => {
            this.currencySymbol = t;
        });

        this.page.on(Page.navigatedToEvent, this.onPageNavigatedTo, this);


    }

    private onPageNavigatedTo(ev: EventData) {
        this.pageRoute.activatedRoute
            .switchMap(activatedRoute => activatedRoute.params)
            .forEach((params) => {
                let tparam = params['tran'];

                if (this.walletService.wallet) {

                    this.walletService.getTransactionFromParams(tparam).subscribe(tran => {

                        if (tran !== null) {

                            tran.type = tran.type || TransactionType.PMA;
                            this.transaction = tran;

                            this.avatar = blockies.createDataURL({ seed: this.transaction.to, scale: 20 });

                            this.translateService.get(['transactionpreview.willexpire', 'transactionpreview.expired']).subscribe(t => {
                                const expireSeconds: number = Number.parseInt(this.config.getConf('transactionTimeoutSeconds'));
                                this.endTime = moment().add(expireSeconds, 's');
                                this.timerSub = Observable.interval(700).subscribe(_ => {
                                    const d = moment.duration(this.endTime.diff(moment()));
                                    if (d.asSeconds() <= 0) {
                                        this.isExpired = true;
                                        this.expireIndication = t['transactionpreview.expired'];
                                        this.timerSub.unsubscribe();
                                    } else {
                                        if (d.asSeconds() <= 60) {
                                            this.isExpiring = true;
                                        }
                                        // tslint:disable-next-line:max-line-length
                                        this.expireIndication = `${t['transactionpreview.willexpire']} ${d.minutes()}:${(d.seconds() < 10 ? ('0' + d.seconds()) : ('' + d.seconds()))}`;
                                    }
                                });
                            });
                            if (this.transaction.networkid !== this.settingsService.networkid) {
                                // tslint:disable-next-line:max-line-length
                                this.translateService.get(['transactionpreview.alert.title', 'transactionpreview.alert.message', 'transactionpreview.alert.ok', `strings.networks.${this.transaction.networkid}`]).subscribe(t => {
                                    dialogs.alert({
                                        title: t['transactionpreview.alert.title'],
                                        message: (t['transactionpreview.alert.message'].toString()).
                                            replace('{{network}}', t[`strings.networks.${this.transaction.networkid}`]),
                                        okButtonText: t['transactionpreview.alert.ok']
                                    }).then(() => {

                                        this.goBack();

                                    });
                                });
                            } else {
                                // this.processTransaction();
                                this.isValidTransaction = this.walletService.validateTransaction(this.transaction);

                                if (!this.isValidTransaction) {
                                    // tslint:disable-next-line:max-line-length
                                    this.translateService.get(['transactionpreview.confirm.title', 'transactionpreview.confirm.message', 'transactionpreview.confirm.ok', 'transactionpreview.confirm.cancel']).subscribe(t => {
                                        dialogs.confirm({
                                            title: t['transactionpreview.confirm.title'],
                                            message: t['transactionpreview.confirm.message'],
                                            okButtonText: t['transactionpreview.confirm.ok'],
                                            cancelButtonText: t['transactionpreview.confirm.cancel']
                                        }).then(result => {
                                            if (result) {
                                                this.processTransaction();
                                            } else {
                                                this.goBack();
                                            }
                                        });
                                    });
                                } else {
                                    this.processTransaction();
                                }
                            }
                        } else {
                            // this.isTransactionDataLoaded = true;
                            // tslint:disable-next-line:max-line-length
                            this.translateService.get(['transactionpreview.badqr.title', 'transactionpreview.badqr.message', 'transactionpreview.badqr.ok']).subscribe(t => {
                                dialogs.alert({
                                    title: t['transactionpreview.badqr.title'],
                                    message: t['transactionpreview.badqr.message'],
                                    okButtonText: t['transactionpreview.badqr.ok']
                                }).then(() => {

                                    this.routerExtensions.navigate(['/home']);

                                });
                            });
                        }
                    });

                } else {
                    this.walletService.storeTempTransaction(this.tran);
                    this.routerExtensions.navigate(['/login']);
                }
            });
    }

    get hasError(): boolean {
        return this.showInvalidAmmount || this.showIvalidGas;
    }
    private processTransaction() {
        this.isTransactionDataLoaded = true;
        this.walletService.gaspriceEstimation().subscribe(g => {
            this.gasPrice = g.toString();
        });
        this.walletService.sendTransactionCallback(
            <DBTransction>{ callback: this.transaction.callback }, TransactionStatus.Scaned).subscribe(r => { });
        this.walletService.getEthRate(`eth${this.settingsService.currency}`).subscribe(r => {
            this.ethRate = r;
        });

        this.walletService.getPMARate().subscribe(r => {
            this.pmaRate = r;
        });
        this.walletService.balance.then((b) => {
            this.balance = b;

            this.walletService.tokenBalance.then(b => {
                this.tokenBalance = b;
                if (this.tokenBalance < this.price) {
                    this.showInvalidAmmount = true;
                    if (this.balance < this.transactionPrice) {
                        this.showIvalidGas = true;
                    }
                } else {
                    this.walletService.estimateGas(this.transaction).then(res => {
                        this.gas = res;
                        if (this.balance < this.transactionPrice) {
                            this.showIvalidGas = true;
                        }
                    });
                }
            });
        });
    }
    get crrTransaction() {
        return this.transaction;
    }


    get transactionPrice(): number {
        const gasPriceWei = ethers.utils.bigNumberify(Number.parseFloat(this.gasPrice) * 1000000000);
        const gasBN = ethers.utils.bigNumberify(this.gas);
        const maxCost = gasPriceWei.mul(gasBN);
        return ethers.utils.formatEther(maxCost);
    }
    get price(): number {
        if (this.transaction) {
            return ethers.utils.formatEther(this.transaction.value) / 1;
        }
        return 0;
    }

    getStatusStr(): string {
        if (this.transaction) {
            return this.transaction.chainTransaction && this.transaction.chainTransaction.status === 1 ? 'Completed' : 'Failed';
        }

    }

    goBack() {
        this.walletService.sendTransactionCallback(<DBTransction>{ callback: this.transaction.callback }, TransactionStatus.Cancelled).subscribe(res => {
            this.routerExtensions.backToPreviousPage();
        });
    }

    get isMainVisible(): boolean {
        return !this.transactionInProgerss && !this.transactionResult;
    }

    onCancel() {
        this.walletService.sendTransactionCallback(<DBTransction>{ callback: this.transaction.callback }, TransactionStatus.Cancelled).subscribe(res => {

        });
        this.routerExtensions.navigate(['/home']);

    }
    private isSubmited: boolean = false;
    onSubmit() {
        if (!this.isSubmited) {
            this.isSubmited = true;
            this.walletService.sendTransaction(this.transaction,
                ethers.utils.bigNumberify(this.gas),
                ethers.utils.bigNumberify(Number.parseFloat(this.gasPrice) * 1000000000)).then(tran => {
                    this.transaction = tran;
                    this.walletService.trackTransactionStatus(this.transaction.hash);
                    this.routerExtensions.navigate(['/home/past-transactions',
                        { 'from': 'submit-transaction', 'hash': this.transaction.hash }], { clearHistory: true });
                });
        }
    }

    ngOnInit() {
        this.page.backgroundColor = '#ffffff';
    }

    ngOnDestroy(): void {
        if (this.timerSub) {
            this.timerSub.unsubscribe();
        }
    }

    onGasChenged(gas) {
        this.gasPrice = gas;
        this.showIvalidGas = false;
        if (this.balance < this.transactionPrice) {
            this.showIvalidGas = true;
        }

    }

    nameTooltip() {
        this.tip = !this.tip;
    }
}
