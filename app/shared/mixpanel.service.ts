import { Injectable, Optional, SkipSelf } from '@angular/core';
import { ConfigService } from './config.service';
import { Subject } from 'rxjs/Subject';
import { MixpanelHelper } from 'nativescript-mixpanel';

@Injectable()
export class MixpanelService {

    private conversSubject = new Subject<any>();
    conversState = this.conversSubject.asObservable();

    constructor(@Optional() @SkipSelf() prior: MixpanelService,
        private config: ConfigService) {
        if (prior) {
            return prior;
        }

        MixpanelHelper.init(this.config.getConf('mixpanel.token', '82d7cd3b82c3ad0dd90922099b774bd4'));
    }
}
