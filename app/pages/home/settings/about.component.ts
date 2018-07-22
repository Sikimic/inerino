import { Component, OnInit, AfterViewInit } from '@angular/core';
import { RouterExtensions } from 'nativescript-angular/router';
import * as utils from 'utils/utils';
import { Page } from 'ui/page';
import * as application from 'application';
import * as frameModule from 'ui/frame';

@Component({
    selector: 'About',
    moduleId: module.id,
    templateUrl: './about.component.html',
    styleUrls: ['./about.component.css']
})
export class AboutComponent implements OnInit, AfterViewInit {

    version = { version: '1.0' };
    constructor(private routerExtensions: RouterExtensions, private page: Page) { }

    ngOnInit() {
        this.page.backgroundColor = '#ffffff';
        this.version.version = this.getVersion();
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

    goBack() {
        this.routerExtensions.backToPreviousPage();
    }

    goto(link: string) {
        utils.openUrl(link);
    }

    private getVersion() {
        if (application.android) {
            const packageManager = application.android.context.getPackageManager();
            return packageManager.getPackageInfo(application.android.context.getPackageName(), 0).versionName;
        } else if (application.ios) {
            const mainBundle = utils.ios.getter(NSBundle, NSBundle.mainBundle);
            return mainBundle.infoDictionary.objectForKey('CFBundleVersion');
        }
    }
}
