import { OnInit, Component, OnDestroy, AfterContentInit, AfterViewInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { WalletService } from '../../../shared/wallet.service';
import { RouterExtensions } from 'nativescript-angular';
import { SettingsService } from '../../../shared/settings.service';
import { TranslateService } from '@ngx-translate/core';
import { Page, View, isAndroid } from 'ui/page';
import * as frameModule from 'ui/frame';
import * as blockies from 'ethereum-blockies-png';
import * as ethers from 'ethers';
import { ListPicker } from 'ui/list-picker';
import { Transaction, TransactionType } from '../../../shared/transaction.model';
import { Erc20Service } from '../../../shared/erc20.service';
import { QRService } from '~/shared/qr.service';
import { DomUtils } from '~/shared/utils/dom.utils';

@Component({
    selector: 'CreateTransaction',
    moduleId: module.id,
    templateUrl: './create-transaction.component.html',
    styleUrls: ['./create-transaction.component.css']
})
export class CreateTransactionComponent implements OnInit, OnDestroy, AfterContentInit, AfterViewInit {

    toAddress: string;
    private address: string;
    amount: string;
    gasPrice: string = '21';
    gas: number = 300000;

    currencySymbol: string;

    items: string[] = [];
    selected: number;
    crrIndex: number = 0;
    pick: boolean;

    transaction: Transaction;

    hasError: boolean = true;
    showInvalidAddress: boolean = false;
    showInvalidAmmount: boolean = false;
    showIvalidGas: boolean = false;
    // tslint:disable-next-line:max-line-length
    avatar: string = 'data:image/jpeg;base64,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';

    renderView = false;
    renderViewTimeout: any;
    token: any;
    tokens: Array<any> = [];

    @ViewChild('root') rootView: ElementRef;

    constructor(private walletService: WalletService,
        private routerExtensions: RouterExtensions,
        private settingsService: SettingsService,
        private translateService: TranslateService,
        private qrServise: QRService,
        private erc20Service: Erc20Service,
        private changeDetectorRef: ChangeDetectorRef,
        private page: Page) {

        this.translateService.get(`strings.symbols.${this.settingsService.currency}`).subscribe(t => {
            this.currencySymbol = t;
        });

    }

    ngAfterViewInit(): void {
        if (this.page.ios) {
            const controller = frameModule.topmost().ios.controller;
            // get the view controller navigation item
            const navigationItem = controller.visibleViewController.navigationItem;
            // hide back button
            navigationItem.setHidesBackButtonAnimated(true, false);
        }
    }

    ngAfterContentInit() {
        this.renderViewTimeout = setTimeout(() => {
            this.renderView = true;
        }, 300);
    }
    ngOnDestroy() {
        clearTimeout(this.renderViewTimeout);
    }

    ngOnInit(): void {

        this.page.backgroundColor = '#ffffff';

        this.erc20Service.selectedTokensWithBalances().subscribe(t => {
            this.tokens = t;
            this.selected = this.tokens.findIndex(t => t.symbol === 'PMA');
            this.crrIndex = this.selected;
            this.token = this.tokens[this.crrIndex];
            this.changeDetectorRef.detectChanges();
        });

        this.walletService.gaspriceEstimation().subscribe(g => {
            this.gasPrice = g.toString();
        });
    }
    get cryptoBalance() {
        const balance = (this.token ? this.token.balance : 0);
        let cbalance = (this.token && this.token.symbol !== 'ETH') ? balance : (balance - this.transactionPrice);
        if (cbalance < 0) {
            cbalance = 0;
        }
        return cbalance;
    }

    get amountValue() {
        const val = this.amount ? Number.parseFloat(this.amount) : 0;
        return val * (this.token ? this.token.rate : 0);
    }

    onAmountChange(ev) {
        this.gnerateTransction();
        this.estimateGas();
    }

    onAddressChange(ev) {
        if (!this.fromScan) {
            this.address = ev.value;
            this.showInvalidAddress = false;
            this.gnerateTransction();
            this.estimateGas();
        } else {
            this.fromScan = false;
        }
    }

    estimateGas() {

        if (this.token && this.token.symbol === 'ETH') {
            this.gas = 21000;
        } else {
            if (this.transaction !== null) {
                this.walletService.estimateGas(this.transaction).then(g => {
                    this.gas = g;
                });
            } else {
                this.gas = 300000;
            }
        }
    }

    gnerateTransction() {
        const validAddress = this.isValidAddress();
        const validAmount = this.isValidAmount();

        if (validAmount && validAddress) {
            this.transaction = <Transaction>{
                to: this.address,
                value: ethers.utils.parseEther(this.amount).toString(10),
                description: '',
                name: '',
                date: new Date(),
                networkid: this.settingsService.networkid,
                type: (this.token && this.token.symbol === 'ETH' ? TransactionType.ETH : TransactionType.ERC20),
                token: this.token
            };
            this.hasError = false;
        } else {
            this.hasError = true;
            this.transaction = null;
        }
    }
    isValidAddress() {
        try {
            this.address = ethers.utils.getAddress(this.address);
            this.avatar = blockies.createDataURL({ seed: this.address, scale: 20 });
            return true;
        } catch (err) {
            // tslint:disable-next-line:max-line-length
            this.avatar = 'data:image/jpeg;base64,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';
            return false;
        }
    }

    isValidAmount() {
        const balance = (this.token ? this.token.balance : 0);
        const val = this.amount ? Number.parseFloat(this.amount) : 0;
        if (this.token && this.token.symbol !== 'ETH') {
            return val > 0 && val <= balance;
        } else {
            return val > 0 && val <= (balance - this.transactionPrice);
        }
    }

    get transactionPrice(): number {
        const gasPriceWei = ethers.utils.bigNumberify(Number.parseFloat(this.gasPrice) * 1000000000);
        const gasBN = ethers.utils.bigNumberify(this.gas);
        const maxCost = gasPriceWei.mul(gasBN);
        return ethers.utils.formatEther(maxCost);
    }

    onGasChanged(gas) {
        this.gasPrice = gas;
    }

    startpick() {
        this.items = this.tokens.map(t => t.symbol);
        this.pick = true;
        DomUtils.setControlInteractionState(<View>this.rootView.nativeElement, false, isAndroid);
    }

    donepick() {
        this.pick = false;
        DomUtils.setControlInteractionState(<View>this.rootView.nativeElement, true, isAndroid);
        if (this.selected !== this.crrIndex) {
            this.selected = this.crrIndex;
            this.token = this.tokens[this.crrIndex];
            this.gnerateTransction();
            this.estimateGas();
        }
    }

    selectedIndexChanged(ev) {
        let picker = <ListPicker>ev.object;
        this.crrIndex = picker.selectedIndex;
    }
    private fromScan: boolean = false;
    scan(): void {
        this.translateService.get(['nav.scan.cancel', 'nav.scan.msg']).subscribe(t => {
            this.qrServise.scan({
                formats: 'QR_CODE',
                cancelLabel: t['nav.scan.cancel'],
                message: t['nav.scan.msg'],
                preferFrontCamera: false,
                showFlipCameraButton: false
            }).then(res => {
                if (res) {
                    this.fromScan = true;
                    this.toAddress = res.text.replace('ethereum:', '');
                    this.fromScan = true;
                    this.address = this.toAddress;
                    this.showInvalidAddress = false;
                    this.gnerateTransction();
                    this.estimateGas();
                }
            });
        });
    }

    get ethBalance() {
        return this.tokens.find(t => t.symbol === 'ETH') || { balance: 0, rate: 0 };
    }
    private isSubmited: boolean = false;
    onSubmit() {
        if (!this.isSubmited) {
            this.isSubmited = true;
            this.gnerateTransction();
            this.estimateGas();
            const eth = this.tokens.find(t => t.symbol === 'ETH') || { balance: 0 };
            const ethBalance = Number.parseFloat(eth.balance);
            this.hasError = this.hasError || (this.transactionPrice >= ethBalance);
            if (this.hasError) {
                this.showInvalidAddress = !this.isValidAddress();
                this.showInvalidAmmount = !this.isValidAmount();
                this.showIvalidGas = this.transactionPrice >= ethBalance;
                this.isSubmited = false;
            } else {
                this.showInvalidAddress = this.showInvalidAmmount = this.showIvalidGas = false;
                this.walletService.sendTransaction(this.transaction,
                    ethers.utils.bigNumberify(this.gas),
                    ethers.utils.bigNumberify(Number.parseFloat(this.gasPrice) * 1000000000)).then(tran => {
                        this.transaction = tran;
                        this.walletService.trackTransactionStatus(this.transaction.hash);
                        this.routerExtensions.navigate(['/home/past-transactions',
                            { 'from': 'submit-transaction', 'hash': this.transaction.hash }, { clearHistory: true }]);
                    });
            }
        }

    }
    onCancel() {
        this.routerExtensions.navigate(['/home/account']);
    }
}
