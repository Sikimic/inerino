import { Component, OnInit, ViewChild, ElementRef, OnDestroy, AfterContentInit, AfterViewInit } from '@angular/core';
import { RouterExtensions } from 'nativescript-angular';
import { Page, isIOS, isAndroid } from 'ui/page';
import { Switch } from 'ui/switch';
import { TextField } from 'ui/text-field';
import { SearchBar } from 'ui/search-bar';
import * as utils from 'utils/utils';
import * as frameModule from 'ui/frame';
import { ListViewEventData } from 'nativescript-ui-listview';
import { Erc20Service } from '../../../../shared/erc20.service';
import { SettingsService } from '../../../../shared/settings.service';
import { ObservableArray } from 'tns-core-modules/data/observable-array/observable-array';
import { TransactionsService } from '~/shared/transactions.service';

@Component({
    selector: 'ERC20',
    moduleId: module.id,
    templateUrl: './erc20tokens.component.html',
    styleUrls: ['./erc20tokens.component.css']
})

export class Erc20TokensComponent implements OnInit, OnDestroy, AfterContentInit, AfterViewInit {

    tip: boolean = false;
    isAuto: boolean = true;
    private _tokens: Array<any> = [];
    tokens: ObservableArray<any>;
    private _filter: string = '';
    renderViewTimeout: any;
    renderView = false;
    @ViewChild('switch') switch: ElementRef;
    @ViewChild('list') listview: any;
    constructor(private routerExtensions: RouterExtensions,
        private erc20Service: Erc20Service,
        private transactionsService: TransactionsService,
        private settingsService: SettingsService,
        private page: Page) { }

    ngOnInit() {
        this.page.backgroundColor = '#ffffff';
        this.isAuto = this.settingsService.receiveTokensAuto;
        this.switch.nativeElement.checked = this.isAuto;
        this.setSwitchColor();

        this._tokens = this.erc20Service.supportedTokensArray();
        this.tokens = new ObservableArray<any>(this._tokens);
    }

    goBack() {
        this.routerExtensions.navigate(['/home/settings'], { transition: { name: 'slideRight' } });
    }

    showTip() {
        this.tip = !this.tip;
    }

    onAuto(ev) {
        this.isAuto = (<Switch>ev.object).checked;
        this.settingsService.receiveTokensAuto = this.isAuto;
        this.setSwitchColor();
    }

    templateSelector(item: any, index: number, items: any): string {
        return item.selected ? 'selected' : 'default';
    }

    onItemTap(event: ListViewEventData) {
        const listView = event.object,
            dataItem = event.view.bindingContext;

        dataItem.selected = !dataItem.selected;
        this.reloadItemOnIndex(event.index);

        this.erc20Service.toggleTokenSelection(dataItem.address);
        this.transactionsService.balanceSubject.next(1);
        if (!dataItem.selected && !this.erc20Service.isInList(dataItem.address)) {
            const ind = this._tokens.findIndex(t => {
                return t.address === dataItem.address;
            });
            this._tokens.splice(ind, 1);
            this.filterTokens();

        }
    }


    private reloadItemOnIndex(index: number) {
        if (isIOS) {
            // Uncomment the lines below to avoid default animation
            // UIView.animateWithDurationAnimations(0, () => {
            const indexPaths = NSMutableArray.new();
            indexPaths.addObject(NSIndexPath.indexPathForRowInSection(index, 0));
            this.listview.listView.ios.reloadItemsAtIndexPaths(indexPaths);
            // });
        }
        if (isAndroid) {
            this.listview.listView.androidListView.getAdapter().notifyItemChanged(index);
        }
    }


    onTextChange(ev) {
        this._filter = (<SearchBar>ev.object).text;

        console.log('onTextChange ' + this._filter);
        this.filterTokens();

    }

    filterTokens() {
        if (this._filter) {
            const rgx = new RegExp(this._filter, 'i');
            this.tokens = new ObservableArray<any>(this._tokens.filter((t) => {
                return t.symbol.match(rgx) || t.name.match(rgx);
            }));
        } else {
            this.tokens = new ObservableArray<any>(this._tokens);
        }
    }

    onSearchBarLoaded(ev) {
        if (ev.object.android) {
            setTimeout(() => {
                ev.object.dismissSoftInput();
                ev.object.android.clearFocus();
            }, 0);
        }
    }

    onClear(ev) {
        this.tokens = new ObservableArray<any>(this._tokens);
    }

    onSubmit(ev) {

    }


    private setSwitchColor() {
        if (isAndroid) {
            if (this.isAuto) {
                this.switch.nativeElement.backgroundColor = '#1E69F5';
                this.switch.nativeElement.color = '#1E69F5';
            } else {
                this.switch.nativeElement.backgroundColor = '#929292';
                this.switch.nativeElement.color = '#929292';
            }
        }
        if (isIOS) {
            if (this.isAuto) {
                this.switch.nativeElement.backgroundColor = '#1E69F5';
                this.switch.nativeElement.color = '#FFFFFF';
            } else {
                this.switch.nativeElement.backgroundColor = '#FFFFFF';
                this.switch.nativeElement.color = '#929292';
            }
        }
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
}
