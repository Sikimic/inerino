import { Component, OnInit, OnDestroy, AfterContentInit, AfterViewInit, ViewChild } from '@angular/core';
import { WalletService } from '../../../shared/wallet.service';
import { RouterExtensions, PageRoute } from 'nativescript-angular/router';
import * as blockies from 'ethereum-blockies-png';
import * as ethers from 'ethers';
import { Transaction, DBTransction, TransactionViewModel } from '../../../shared/transaction.model';
import { BarcodeScanner } from 'nativescript-barcodescanner';
import * as utils from 'utils/utils';
import { TranslateService } from '@ngx-translate/core';
import { SettingsService } from '../../../shared/settings.service';
import { Page, isIOS, isAndroid } from 'ui/page';
import * as frameModule from 'ui/frame';
import { ToastService, ToastMsg } from '../../../shared/toast.service';
import { TransactionsService } from '../../../shared/transactions.service';
import { ListViewEventData, RadListView } from 'nativescript-ui-listview';
import { ConfigService } from '../../../shared/config.service';
import { ObservableArray } from 'tns-core-modules/data/observable-array/observable-array';

@Component({
    selector: 'PastTransactions',
    moduleId: module.id,
    templateUrl: './past-transactions.component.html',
    styleUrls: ['./past-transactions.component.css']
})
export class PastTransactionsComponent implements OnInit, OnDestroy, AfterContentInit, AfterViewInit {

    private _transactions: ObservableArray<TransactionViewModel>;

    submitedMsg: ToastMsg;
    crrSelected: number = -1;
    tipindex: number = -1;
    ethRate: number = 0;
    pmaRate: number = 1;
    isFiltered: boolean = false;
    currencySymbol: string;
    constructor(
        private walletService: WalletService,
        private routerExtensions: RouterExtensions,
        private barcodeScanner: BarcodeScanner,
        private settingsService: SettingsService,
        private translateService: TranslateService,
        private toastService: ToastService,
        private transactionsService: TransactionsService,
        private page: Page,
        private pageRoute: PageRoute,
        private config: ConfigService
    ) { }
    renderView = false;
    renderViewTimeout: any;
    submitedTransactionHash: string;

    isEmpty: boolean = false;

    @ViewChild('list') listview: any;


    get transactions() {
        return this._transactions;
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
    ngOnInit() {

        this.isFiltered = this.transactionsService.hasFilter();
        this.transactionsService.getTransactions().subscribe(tran => {
            this._transactions = new ObservableArray<TransactionViewModel>(tran);
            this.isEmpty = tran.length === 0;
            this.listview.nativeElement.refresh();
        });
        this.transactionsService.transactionState.subscribe(c => {
            if (c > 0) {
                this.transactionsService.getTransactions().subscribe(tran => {
                    this._transactions = new ObservableArray<TransactionViewModel>(tran);
                    this.isEmpty = tran.length === 0;
                    this.listview.nativeElement.refresh();
                });
            }
        });

        this.pageRoute.activatedRoute
            .switchMap(activatedRoute => activatedRoute.params)
            .forEach((params) => {
                const from = params['from'];
                if (from === 'submit-transaction') {
                    this.submitedTransactionHash = params['hash'];
                }

                this.page.backgroundColor = '#ffffff';
                this.translateService.get(`strings.symbols.${this.settingsService.currency}`).subscribe(t => {
                    this.currencySymbol = t;
                });

                this.walletService.getEthRate(`eth${this.settingsService.currency}`).subscribe(r => {
                    this.ethRate = r;
                });

                this.walletService.getPMARate().subscribe(r => {
                    this.pmaRate = r;
                });

                if (this.submitedTransactionHash) {
                    // this.crrSelected = 0;
                    this.translateService.get(['transactionpreview.wait']).subscribe(t => {
                        this.submitedMsg = <ToastMsg>{
                            message: t['transactionpreview.wait'],
                            color: '#2CC93C',
                            icon: null,
                            clbk: null,
                            timeout: 5000
                        };
                    });

                }
            });
    }

    gotoSettings() {
        this.routerExtensions.navigate(['/home/settings'], {
            transition: {
                name: 'slide'
            }
        });
    }

    gotoFilter() {
        this.routerExtensions.navigate(['/home/filter-transactions'], {
            transition: {
                name: 'slideTop'
            }
        });
    }

    templateSelector(item: any, index: number, items: any): string {
        return item.expanded ? 'expanded' : 'default';
    }

    onItemTap(event: ListViewEventData) {
        const prevSelected = this.crrSelected;
        this.crrSelected = (this.crrSelected === event.index) ? -1 : event.index;
        const listView = event.object,
            dataItem = event.view.bindingContext;

        dataItem.expanded = !dataItem.expanded;

        if (isAndroid) {
            listView.androidListView.getAdapter().notifyItemChanged(event.index);
            if (prevSelected !== -1 && prevSelected !== event.index) {
                let ps = this.transactions.getItem(prevSelected);
                if (ps.expanded) {
                    ps.expanded = false;
                    this.transactions.setItem(prevSelected, ps);
                    listView.androidListView.getAdapter().notifyItemChanged(prevSelected);
                }
            }
        }
        if (isIOS) {
            const indexPaths = NSMutableArray.new();
            indexPaths.addObject(NSIndexPath.indexPathForRowInSection(event.index, 0));
            if (prevSelected !== -1 && prevSelected !== event.index) {
                let ps = this.transactions.getItem(prevSelected);
                if (ps.expanded) {
                    ps.expanded = false;
                    this.transactions.setItem(prevSelected, ps);
                    indexPaths.addObject(NSIndexPath.indexPathForRowInSection(prevSelected, 0));
                }
            }
            // UIView.animateWithDurationAnimations(0, () => {
            listView.ios.reloadItemsAtIndexPaths(indexPaths);
            // });
        }

    }

    private reloadItemOnIndex(index: number) {
        if (isIOS) {    // Uncomment the lines below to avoid default animation
            // UIView.animateWithDurationAnimations(0, () => {
            console.log('**************************');
            const indexPaths = NSMutableArray.new();
            indexPaths.addObject(NSIndexPath.indexPathForRowInSection(index, 0));
            console.log(indexPaths);
            this.listview.listView.ios.reloadItemsAtIndexPaths(indexPaths);
            console.log('___________________________');
            // });
        }
        if (isAndroid) {
            this.listview.listView.androidListView.getAdapter().notifyItemChanged(index);
        }
    }

    nametip(index: number) {
        this.tipindex = (this.tipindex === index) ? -1 : index;
        this.reloadItemOnIndex(index);
    }

    goToEtherScan(hash: string) {
        utils.openUrl(this.config.getConf('etherscanTxUrl') + hash);
    }

    send() {

        this.routerExtensions.navigate(['/home/create-transaction']);
    }

    scan(): void {
        this.translateService.get(['nav.scan.cancel', 'nav.scan.msg']).subscribe(t => {
            this.barcodeScanner.scan({
                formats: 'QR_CODE',
                cancelLabel: t['nav.scan.cancel'],
                message: t['nav.scan.msg'],
                preferFrontCamera: false,
                showFlipCameraButton: false
            }).then(res => {
                this.routerExtensions.navigate(['/home/transaction', { 'tran': res.text }]);
            });
        });
    }
}
