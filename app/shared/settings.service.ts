
import { Injectable, SkipSelf, Optional } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/observable/timer';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';

import { SecureStorage } from 'nativescript-secure-storage';
import { TranslateService } from '@ngx-translate/core';


@Injectable()
export class SettingsService {
    storage: SecureStorage;
    private _lang: string = 'en';
    private _currency: string = 'usd';
    private _networkid: number = 1;
    private _receiveTokensAuto: boolean = true;
    constructor(@Optional() @SkipSelf() prior: SettingsService, private http: HttpClient) {
        if (prior) { return prior; }
        this.storage = new SecureStorage();

        let crr = this.storage.getSync({ key: 'puma.wallet.settings' });
        if (crr) {
            crr = JSON.parse(crr);
            this._lang = crr.lang;
            this._currency = crr.currency;
            this._networkid = crr.networkid || 1;
            this._receiveTokensAuto = typeof (crr.receiveTokensAuto) === 'undefined' ? this._receiveTokensAuto : crr.receiveTokensAuto;
        }
    }

    get receiveTokensAuto() {
        return this._receiveTokensAuto;
    }
    set receiveTokensAuto(value: boolean) {
        this._receiveTokensAuto = value;
        this.save();
    }

    get networkid() {
        return this._networkid;
    }
    set networkid(value: number) {
        this._networkid = value;
        this.save();
    }
    get lang() {
        return this._lang;
    }

    set lang(value: string) {
        this._lang = value;
        this.save();
    }

    get currency() {
        return this._currency;
    }

    set currency(value: string) {
        this._currency = value;
        this.save();

    }

    private save() {
        this.storage.setSync({
            key: 'puma.wallet.settings',
            value: JSON.stringify({
                lang: this._lang,
                currency: this._currency,
                networkid: this._networkid,
                receiveTokensAuto: this._receiveTokensAuto
            })
        });
    }
}
