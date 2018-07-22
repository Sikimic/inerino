import { Injectable, Optional, SkipSelf } from '@angular/core';
import * as appsFlyer from 'nativescript-plugin-appsflyer';
import { ConfigService } from './config.service';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class AppsFlyerService {

    private conversSubject = new Subject<any>();
    conversState = this.conversSubject.asObservable();

    constructor(@Optional() @SkipSelf() prior: AppsFlyerService,
        private config: ConfigService) {
        if (prior) {
            return prior;
        }

        this.init();
    }

    private init() {
        appsFlyer.initSdk({
            devKey: this.config.getConf('appsflyer.devkey', 'U2Ui6kMs48a6ebLdomZWJZ'),
            appId: this.config.getConf('appsflyer.appId', '1376601366'),
            onConversionDataSuccess: data => {
                this.conversSubject.next(data);
                console.log(JSON.stringify(data));
            },
            onConversionDataFailure: err => {
                console.log(JSON.stringify(err));
            }
        }).then(res => {
            console.log(JSON.stringify(res));
        });
    }
}
