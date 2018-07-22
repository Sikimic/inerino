import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Page } from 'ui/page';
import { WalletService } from '../../shared/wallet.service';
import { RouterExtensions } from 'nativescript-angular/router';
import { TranslateService } from '@ngx-translate/core';
import * as frameModule from 'ui/frame';

@Component({
    selector: 'Restore',
    moduleId: module.id,
    templateUrl: './restore.component.html',
    styleUrls: ['./login-common.css', './login.component.css']
})
export class RestoreComponent implements OnInit, AfterViewInit {
    password: string = '';
    confirmPassword: string = '';
    mnemonic: string = '';
    step: number = 0;
    validMnemonic: boolean = true;
    validPass: boolean = true;
    validpassMatch: boolean = true;

    errorTxt: string = '';
    @ViewChild('mmnemonic') mText: any;
    emptyMnemonic: boolean = false;
    constructor(private page: Page,
        private walletService: WalletService,
        private routerExtensions: RouterExtensions ) {
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
    ngOnInit(): void {
        this.page.backgroundColor = '#ffffff';
    }

    blur(args) {
        this.mText.nativeElement.dismissSoftInput();
    }
    tblur(args) {
        // this.mText.nativeElement.focus();
    }
    onTextChange(ev) {
        this.validMnemonic = true;
        this.emptyMnemonic = false;
        this.validPass = true;
        this.validpassMatch = true;
    }

    get hasError() {
        return  this.errorTxt.length !== 0;
    }

    continue() {
        const mnm = this.mnemonic.trim();
        if (mnm.length === 0) {
            this.emptyMnemonic = true;
        } else if (!this.walletService.isValidMnemonic(mnm)) {
            this.validMnemonic = false;
        } else {
            this.validMnemonic = true;
            this.step = 1;
        }
    }

    submit() {
            if (this.password.length < 8) {
                this.validPass = false;
            } else if (this.password !== this.confirmPassword) {
                this.validpassMatch = false;
            } else {
                this.walletService.restore(this.mnemonic.trim(), this.password).then(() => {
                    let tmpTran = this.walletService.getTempTransaction();
                    if (tmpTran) {
                        this.routerExtensions.navigate(['/home/transaction', {'tran': tmpTran}]);
                    } else {
                        this.routerExtensions.navigate(['/home/account'],  {clearHistory: true});
                    }
                }).catch(() => {

                });
            }
    }

    onCancel() {
        this.routerExtensions.back();
    }

    goBack() {
        this.routerExtensions.back();
    }
}
