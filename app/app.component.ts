import { Component, OnInit, OnDestroy, EventEmitter, NgZone } from '@angular/core';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { TranslateService } from '@ngx-translate/core';

import { RouterExtensions } from 'nativescript-angular';
import { Page } from 'ui/page';
import * as application from 'application';
import { isAndroid, isIOS, screen } from 'platform';
import { SettingsService } from './shared/settings.service';
import { AppsFlyerService } from './shared/appsflyer.service';
import { MixpanelService } from './shared/mixpanel.service';
import { FirebaseService } from '~/shared/firebase.service';

require('nativescript-platform-css');

let onRouteToURL: ReplaySubject<string>;
if (isIOS) {
    const { CustomAppDelegate, iOSOnRouteToURL } = require('./activity');
    application.ios.delegate = CustomAppDelegate;
    onRouteToURL = iOSOnRouteToURL;
} else if (isAndroid) {
    onRouteToURL = require('./activity').androidOnRouteToURL;
}

@Component({
    selector: 'ns-app',
    templateUrl: 'app.component.html'
})
export class AppComponent implements OnInit, OnDestroy {

    public static instanceCounter = 0;
    private instanceNum;

    constructor(
        private zone: NgZone,
        private routerExt: RouterExtensions,
        private translateService: TranslateService,
        private settingsService: SettingsService,
        private appsFlyerService: AppsFlyerService,
        private mixpanelService: MixpanelService,
        private firebaseService: FirebaseService,
        private page: Page
    ) {
        translateService.setDefaultLang('en');
        translateService.use(this.settingsService.lang);
        this.instanceNum = ++AppComponent.instanceCounter;
        console.log(`<${this.instanceNum}>AppComponent.constructor`);

    }

    ngOnInit() {

        console.log(`<${this.instanceNum}>AppComponent.onInit`);

        this.addLifecycleEventlisteners();

        // Subscribe to routing events from both platforms
        onRouteToURL.subscribe((url) => {
            this.handleRouting(url);
        });

        console.log(screen.mainScreen.widthDIPs);
        console.log(screen.mainScreen.widthPixels);

        this.firebaseService.init();
    }

    ngOnDestroy() {
        console.log(`<${this.instanceNum}>AppComponent.onDestroy`);
        this.removeLifecycleEventlisteners();
    }

    handleRouting(url: string) {
        // Assume everything after :// is an app route
        // in production you might want to limit which routes are allowed to deep-link
        const route = url.substr(url.indexOf('://') + 3);
        console.log(`AppComponent: Navigate to route '${route}'`);

        // Do the routing in the Angular Zone on next tick,
        // to ensure that we're in the right context and router is ready.
        setTimeout(() => {
            this.zone.run(() => {
                this.routerExt.navigateByUrl(route);
            });
        });
    }


    // NOTE: These life-cycle listeners are not necessary for deep-linking
    addLifecycleEventlisteners() {

        application.on(application.launchEvent, function (args: application.ApplicationEventData) {
            if (args.android) {
                // For Android applications, args.android is an android.content.Intent class.
                console.log('Launched Android application with the following intent: ' + args.android + '.');
            } else if (args.ios !== undefined) {
                // For iOS applications, args.ios is NSDictionary (launchOptions).
                console.log('Launched iOS application with options: ' + args.ios);
            }
        });

        application.on(application.suspendEvent, function (args: application.ApplicationEventData) {
            if (args.android) {
                // For Android applications, args.android is an android activity class.
                console.log('ActivitySuspend: ' + args.android);
            } else if (args.ios) {
                // For iOS applications, args.ios is UIApplication.
                console.log('UIApplication: ' + args.ios);
            }
        });

        application.on(application.resumeEvent, function (args: application.ApplicationEventData) {
            if (args.android) {
                // For Android applications, args.android is an android activity class.
                console.log('ActivityResume: ' + args.android);
            } else if (args.ios) {
                // For iOS applications, args.ios is UIApplication.
                console.log('UIApplication: ' + args.ios);
            }
        });

        application.on(application.exitEvent, function (args: application.ApplicationEventData) {
            if (args.android) {
                // For Android applications, args.android is an android activity class.
                console.log('ActivityExit: ' + args.android);
            } else if (args.ios) {
                // For iOS applications, args.ios is UIApplication.
                console.log('UIApplication: ' + args.ios);
            }
        });

        application.on(application.lowMemoryEvent, function (args: application.ApplicationEventData) {
            if (args.android) {
                // For Android applications, args.android is an android activity class.
                console.log('ActivityLowMem: ' + args.android);
            } else if (args.ios) {
                // For iOS applications, args.ios is UIApplication.
                console.log('UIApplication: ' + args.ios);
            }
        });

        application.on(application.uncaughtErrorEvent, function (args: application.ApplicationEventData) {
            if (args.android) {
                // For Android applications, args.android is an NativeScriptError.
                console.log('NativeScriptError: ' + args.android);
            } else if (args.ios) {
                // For iOS applications, args.ios is NativeScriptError.
                console.log('NativeScriptError: ' + args.ios);
            }
        });
    }

    removeLifecycleEventlisteners() {
        application.off(application.launchEvent);
        application.off(application.suspendEvent);
        application.off(application.resumeEvent);
        application.off(application.exitEvent);
        application.off(application.lowMemoryEvent);
        application.off(application.uncaughtErrorEvent);
    }
}
