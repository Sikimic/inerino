import { Component, OnInit, AfterViewInit } from '@angular/core';
import { RouterExtensions } from 'nativescript-angular/router';
import { TranslateService } from '@ngx-translate/core';
import { PageRoute } from 'nativescript-angular';
import { Page } from 'ui/page';
import * as frameModule from 'ui/frame';

@Component({
    selector: 'GenericText',
    moduleId: module.id,
    templateUrl: './generictext.component.html',
    styleUrls: ['./generictext.component.css']
})
export class GenericTextComponent implements OnInit, AfterViewInit {

    title: string = 'Terms';
    content: string = '';
    constructor(private routerExtensions: RouterExtensions,
        private translateService: TranslateService, private pageRoute: PageRoute,
        private page: Page) { }

    ngOnInit(): void {
        this.page.backgroundColor = '#ffffff';
        this.pageRoute.activatedRoute
            .switchMap(activatedRoute => activatedRoute.url)
            .forEach((url) => {
                this.translateService.get([`generictext.${url[0]}.title`, `generictext.${url[0]}.content`]).subscribe(t => {
                    this.title = t[`generictext.${url[0]}.title`];
                    this.content = t[`generictext.${url[0]}.content`];
                });
            });
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
}
