import { Component, OnInit, OnDestroy, AfterContentInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { WalletService } from '../../shared/wallet.service';
import { RouterExtensions } from 'nativescript-angular/router';
import * as blockies from 'ethereum-blockies-png';
import * as dialogs from 'ui/dialogs';
import * as utils from 'utils/utils';
import { SettingsService } from '../../shared/settings.service';
import { TranslateService } from '@ngx-translate/core';
import { Page, View, isAndroid } from 'ui/page';
import * as frameModule from 'ui/frame';
import { ConfigService } from '../../shared/config.service';
import { ToastService, ToastMsg } from '../../shared/toast.service';
import * as SocialShare from 'nativescript-social-share';
import * as ImageSource from 'image-source';
import { TransactionsService } from '../../shared/transactions.service';
import { Erc20Service } from '../../shared/erc20.service';
import { ListViewEventData } from 'nativescript-ui-listview';
import { ObservableArray } from 'tns-core-modules/data/observable-array/observable-array';
import { QRService } from '~/shared/qr.service';
import { DomUtils } from '~/shared/utils/dom.utils';
let clipboard = require('nativescript-clipboard');

@Component({
    selector: 'Home',
    moduleId: module.id,
    templateUrl: './home.component.html',
    styleUrls: ['./home-common.css', './home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy, AfterContentInit, AfterViewInit {

    address: string = '';
    avatar: string = '';
    qr: string;
    tip: boolean = false;
    copied: boolean = false;
    vicon: string = String.fromCharCode(0xf05a);
    refreshing: boolean = false;
    isShowPopup: boolean = false;
    currencySymbol: string = 'USD';

    renderView = false;
    renderViewTimeout: any;

    _tokens: ObservableArray<any>;
    @ViewChild('list') listview: any;
    @ViewChild('root') rootView: ElementRef;
    constructor(
        private page: Page,
        private walletService: WalletService,
        private transactionsService: TransactionsService,
        private routerExtensions: RouterExtensions,
        private qrService: QRService,
        private settingsService: SettingsService,
        private translateService: TranslateService,
        private erc20Service: Erc20Service,
        private config: ConfigService,
        private toastService: ToastService
    ) {
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

    onItemReordered(args: ListViewEventData) {
        this.reorderIndex = -1;
        console.log('Item reordered. Old index: ' + args.index + ' ' + 'new index: ' + args.data.targetIndex);

        const listView = args.object,
            dataItem = args.view.bindingContext;

        this.erc20Service.updateTokenIndex(dataItem.address, args.data.targetIndex);
        listView.scrollToIndex(args.data.targetIndex, false);

    }
    reorderIndex: number = -1;
    onItemReorderedStarting(args: ListViewEventData) {
        if (args.index < 2) {
            args.returnValue = false;
        } else {
            this.reorderIndex = args.index;
            console.log('onItemReorderedStarting ' + args.index);
        }
    }
    get tokens() {
        return this._tokens;
    }

    onItemTap(args: ListViewEventData) {
        const dataItem = args.view.bindingContext;
        if (dataItem.address !== '0x') {
            this.translateService.get(['account.token.title', 'account.token.visit', 'account.token.remove', 'account.token.cancel']).subscribe(t => {
                const actions = (dataItem.address === this.config.getConf('token.address')) ? [t['account.token.visit']] :
                    [t['account.token.visit'], t['account.token.remove']];
                dialogs.action({
                    message: dataItem.name + ' ' + t['account.token.title'],
                    cancelButtonText: t['account.token.cancel'],
                    actions: actions
                }).then((result) => {
                    if (result === t['account.token.visit']) {
                        utils.openUrl(this.config.getConf('ethesrcan.tokenurl', 'https://etherscan.io/token/') + dataItem.address);
                    } else if (result === t['account.token.remove']) {
                        this.erc20Service.toggleTokenSelection(dataItem.address);
                        this._tokens.splice(args.index, 1);
                    }
                });
            });
        }
    }

    ngOnInit(): void {
        this.page.backgroundColor = '#ffffff';
        this.translateService.get(`strings.symbols.${this.settingsService.currency}`).subscribe(t => {
            this.currencySymbol = t;
        });
        if (!this.walletService.wallet) {
            this.address = 'no address';
        } else {
            this.erc20Service.selectedTokensWithBalances().subscribe(t => {
                this._tokens = new ObservableArray<any>(t);
                if (this.listview && this.listview.nativeElement) {
                    this.listview.nativeElement.refresh();
                }
            });

            this.transactionsService.balanceState.subscribe(b => {
                this.refresh();
            });

            this.address = this.walletService.wallet.address;
            this.avatar = blockies.createDataURL({ seed: this.walletService.wallet.address, scale: 20 });
            this.qr = this.config.getConf('qrapi', 'http://api.qrserver.com/v1/create-qr-code/?data=ethereum:{address}&size=230x230&color=1e69f5&margin=18').
                replace('{address}', this.walletService.wallet.address);
        }
    }
    refresh() {
        this.refreshing = true;
        this.erc20Service.selectedTokensWithBalances().subscribe(t => {
            this._tokens = new ObservableArray<any>(t);
            this.refreshing = false;
            this.listview.nativeElement.refresh();
        });
    }

    addressTooltip(): void {
        this.tip = !this.tip;
    }
    copy(): void {
        this.copied = true;
        clipboard.setText(this.address).then(() => {

            this.translateService.get('account.copied').subscribe((m) => {

                this.toastService.activate(<ToastMsg>{
                    message: m,
                    icon: null,
                    color: '#2CC93C',
                    timeout: 3000,
                    clbk: () => {
                        this.copied = false;
                    }
                });
            });
        });

    }
    remove(): void {
        this.walletService.remove();
        this.routerExtensions.navigate(['/login/create']);
    }

    gotoTranasctions(): void {
        this.routerExtensions.navigate(['/home/past-transactions']);
    }
    send() {
        this.routerExtensions.navigate(['/home/create-transaction']);
    }

    gotoSettings() {
        this.routerExtensions.navigate(['/home/settings'], {
            transition: {
                name: 'slide'
            }
        });
    }

    scan(): void {
        // this.routerExtensions.navigate(['/home/transaction', {'tran': '{"url":"https://s3.amazonaws.com/media-ro/puma/2018/5/15/11637_10305184.js"}'}]);
        this.translateService.get(['nav.scan.cancel', 'nav.scan.msg']).subscribe(t => {
            this.qrService.scan({
                formats: 'QR_CODE',
                cancelLabel: t['nav.scan.cancel'],
                message: t['nav.scan.msg'],
                preferFrontCamera: false,
                showFlipCameraButton: false
            }).then(res => {
                if (res) {
                    this.routerExtensions.navigate(['/home/transaction', { 'tran': res.text }]);
                }
            });
        });
    }

    showQR() {
        if (!this.isShowPopup) {
            this.isShowPopup = true;
            DomUtils.setControlInteractionState(<View>this.rootView.nativeElement, false, isAndroid);
        }
    }

    closeQR() {
        this.isShowPopup = false;
        setTimeout(() => {

            DomUtils.setControlInteractionState(<View>this.rootView.nativeElement, true, isAndroid);
        }, 100);

    }

    shareQr() {
        if (this.qr) {
            ImageSource.fromUrl(this.qr).then((image) => {
                SocialShare.shareImage(image);
            });
        }
    }
    dummy() {
        return false;
    }
}
