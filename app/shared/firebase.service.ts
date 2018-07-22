import { Injectable, Optional, SkipSelf } from '@angular/core';
import { ConfigService } from '~/shared/config.service';

const firebase = require('nativescript-plugin-firebase');

@Injectable()
export class FirebaseService {


    isInitialized: boolean = false;
    constructor(@Optional() @SkipSelf() prior: FirebaseService,
        private config: ConfigService) {
        if (prior) {
            return prior;
        }
    }

    public init(): void {
        firebase.init({
            onPushTokenReceivedCallback: (token) => {
                console.log('Firebase push token: ' + token);
            },
            onMessageReceivedCallback: (message) => {
                console.log(`Title: ${message.title}`);
                console.log(`Body: ${message.body}`);
            },
            persist: false
        })
            .then(() => {
                console.log('>>>>> Firebase initialized');
                this.isInitialized = true;
            })
            .catch(err => console.log('>>>>> Firebase init error: ' + err));
    }
}
