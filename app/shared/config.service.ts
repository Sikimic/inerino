
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
import { SettingsService } from './settings.service';
import { NSCrypto } from 'nativescript-crypto';
import { environment } from './environment';

const config = require('../tools/config.json');

import * as _ from 'lodash';
const crypto = new NSCrypto();
@Injectable()
export class ConfigService {

    private conf: any;
    constructor(@Optional() @SkipSelf() prior: ConfigService, private http: HttpClient, private settingsService: SettingsService) {
        if (prior) { return prior; }
    }

    getConf(key: string, def: any = null) {
        key = this.network + '.' + key;
        const res = _.at(this.conf, key);
        if (res && res.length > 0 && res[0]) {
            return res[0];
        }
        return def;
    }

    private get network() {
        switch (this.settingsService.networkid) {
            default:
            case 3: return 'ropsten';
            case 1: return 'mainnet';
        }
    }


    load() {
        return new Promise((resolve, reject) => {
            this.conf = config;
            this.http.get('https://s3-eu-west-1.amazonaws.com/pumawalet.locales/config.json').catch(err => {
                return Observable.of(null);
            }).subscribe(c => {
                if (c) {
                    _.merge(this.conf, c);
                }
                resolve(true);
            });
        });
    }
}
