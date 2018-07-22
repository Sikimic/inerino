import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { ListPicker } from 'ui/list-picker';
import { RouterExtensions } from 'nativescript-angular/router';
import { SettingsService } from '../../../shared/settings.service';
import { TranslateService } from '@ngx-translate/core';
import { ConfigService } from '../../../shared/config.service';
import { WalletService } from '../../../shared/wallet.service';
import { Page, isAndroid, View } from 'ui/page';
import { DBService } from '../../../shared/db.service';
import * as frameModule from 'ui/frame';
import { DomUtils } from '~/shared/utils/dom.utils';

@Component({
    selector: 'Settings',
    moduleId: module.id,
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit, AfterViewInit {

    items: string[] = [];
    selected: number = 1;
    pick: boolean = false;
    crrPicker: string = '';

    private _lang: string = 'en';
    private _currency: string = 'usd';
    private _networkId: number = 3;
    crrIndex: number = -1;

    @ViewChild('root') rootView: ElementRef;
    constructor(private routerExtensions: RouterExtensions,
        private translateService: TranslateService,
        private settingsService: SettingsService,
        private walletService: WalletService,
        private dbService: DBService,
        private page: Page,
        private config: ConfigService) { }

    ngAfterViewInit(): void {
        if (this.page.ios) {
            const controller = frameModule.topmost().ios.controller;
            // get the view controller navigation item
            const navigationItem = controller.visibleViewController.navigationItem;
            // hide back button
            navigationItem.setHidesBackButtonAnimated(true, false);
        }
    }

    ngOnInit() {
        this.page.backgroundColor = '#ffffff';
        this._lang = this.settingsService.lang;
        this._currency = this.settingsService.currency;
        this._networkId = this.settingsService.networkid;
    }

    get currency() {
        return this.translateService.get(`strings.symbols.${this._currency}`);
    }

    get lang() {
        return this.translateService.get(`strings.langs.${this._lang}`);
    }

    get networkId() {
        return this.translateService.get(`strings.networks.${this._networkId}`);
    }

    goBack() {
        this.routerExtensions.navigate(['/home/account'], { transition: { name: 'slideRight' } });
    }

    startpick(picker) {
        this.crrPicker = picker;
        if (this.crrPicker === 'currency') {
            this.createPicker('currencyList', 'strings.symbols.', this._currency);
        } else if (this.crrPicker === 'lang') {
            this.createPicker('langsList', 'strings.langs.', this._lang);
        } else if (this.crrPicker === 'net') {
            this.createPicker('networksList', 'strings.networks.', this._networkId);
        }
    }

    private createPicker(listKey, prefix, crrid) {
        let list = this.config.getConf(listKey);
        let keys = list.map(k => `${prefix}${k}`);
        this.translateService.get(keys).subscribe(t => {
            this.items = list.map(k => t[`${prefix}${k}`]);
            this.selected = list.findIndex(i => i === crrid);
            this.crrIndex = this.selected;
            this.pick = true;
            DomUtils.setControlInteractionState(<View>this.rootView.nativeElement, false, isAndroid);
        });
    }

    donepick() {
        if (this.selected !== this.crrIndex) {
            if (this.crrPicker === 'currency') {
                this._currency = this.config.getConf('currencyList')[this.crrIndex];
                this.settingsService.currency = this._currency;
            } else if (this.crrPicker === 'lang') {
                this._lang = this.config.getConf('langsList')[this.crrIndex];
                this.settingsService.lang = this._lang;
                this.translateService.use(this._lang);
            } else if (this.crrPicker === 'net') {
                this._networkId = this.config.getConf('networksList')[this.crrIndex];
                this.settingsService.networkid = this._networkId;
                this.walletService.changeNetwork();
            }
        }
        this.pick = false;
        DomUtils.setControlInteractionState(<View>this.rootView.nativeElement, true, isAndroid);
    }

    selectedIndexChanged(ev) {
        let picker = <ListPicker>ev.object;
        this.crrIndex = picker.selectedIndex;

    }

    logout() {
        this.walletService.remove(false);
        this.dbService.destroy();
        this.routerExtensions.navigate(['/login/create'], { clearHistory: true });
    }
}
