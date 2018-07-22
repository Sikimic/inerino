import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Page } from 'ui/page';
import { WalletService } from '../../shared/wallet.service';
import { RouterExtensions } from 'nativescript-angular/router';
import { TranslateService } from '@ngx-translate/core';
import * as frameModule from 'ui/frame';

@Component({
    selector: 'ChangePassword',
    moduleId: module.id,
    templateUrl: './change-password.component.html',
    styleUrls: ['./login-common.css', './login.component.css', './change-password.component.css']
})
export class ChangePasswordComponent implements OnInit, AfterViewInit {

    password: string = '';
    confirmPassword: string = '';
    crrPassword: string = '';
    errorTxt: string = '';
    constructor( private translateService: TranslateService,
        private walletService: WalletService,
        private routerExtensions: RouterExtensions,
        private page: Page
    ) {

    }

    ngOnInit(): void {

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


    onTextChange(ev) {
        this.errorTxt = '';
    }

    get hasError() {
        return  this.errorTxt.length !== 0;
    }

    goBack() {
        this.routerExtensions.backToPreviousPage();
    }

    submit(): void {
        this.translateService.get(['errors.shortPassword', 'errors.passwordNotMatch', 'errors.wrongPassword']).subscribe(t => {
            if (this.crrPassword.length < 8) {
                this.errorTxt = t['errors.shortPassword'];
            } else {
                this.walletService.checkPassword(this.crrPassword).then(res => {
                    if (res) {
                        if (this.password.length < 8) {
                            this.errorTxt = t['errors.shortPassword'];
                        } else if (this.password !== this.confirmPassword) {
                            this.errorTxt = t['errors.passwordNotMatch'];
                        } else {
                            this.walletService.changePassword(this.password);
                            this.routerExtensions.backToPreviousPage();
                        }
                    } else {
                        this.errorTxt = t['errors.wrongPassword'];
                    }
                });
            }
        });

    }

}
