import { Component, OnInit, ViewChild, HostBinding } from '@angular/core';
import { Page } from 'ui/page';
import { WalletService } from '../../shared/wallet.service';
import { LoginState } from '../../shared/enums';
import { RouterExtensions } from 'nativescript-angular/router';
import { ErrorMsgs } from '../../shared/errorMsgs';
import { TranslateService } from '@ngx-translate/core';
import * as dialogs from 'ui/dialogs';
import { isAndroid, isIOS, screen } from 'platform';
import { ToastMsg, ToastService } from '../../shared/toast.service';
let clipboard = require('nativescript-clipboard');

@Component({
    selector: 'Create',
    moduleId: module.id,
    templateUrl: './create.component.html',
    styleUrls: ['./login-common.css', './login.component.css']
})
export class CreateComponent implements OnInit {
    password: string = '';
    confirmPassword: string = '';
    mnemonic: string = '';
    state: LoginState = LoginState.Create;

    errorTxt: string = '';
    icon: string = String.fromCharCode(0xf057);
    copied: boolean = false;
    @ViewChild('mtext') mText: any;
    constructor(private page: Page,
        private translateService: TranslateService, private toastService: ToastService,
        private walletService: WalletService, private routerExtensions: RouterExtensions ) {
    }


    ngOnInit(): void {
        this.page.actionBarHidden = true;
        this.page.backgroundColor = '#ffffff';
        console.log(this.page.className);
    }

    blur(args) {
        this.mText.nativeElement.dismissSoftInput();
    }
    tblur(args) {
        this.mText.nativeElement.focus();
    }

    onTextChange(ev) {
        this.errorTxt = '';
    }

    get hasError() {
        return  this.errorTxt.length !== 0;
    }

    submit(): void {
        this.translateService.get(['errors.shortPassword', 'errors.passwordNotMatch']).subscribe(t => {
            if (this.password.length < 8) {
                this.errorTxt = t['errors.shortPassword'];
            } else if (this.password !== this.confirmPassword) {
                this.errorTxt = t['errors.passwordNotMatch'];
            } else {
                this.mnemonic = this.walletService.create(this.password);
                this.state = LoginState.Created;
            }
        });
    }

    onGotoHome() {
        this.translateService.get(['create.confirm.title', 'create.confirm.message', 'create.confirm.ok', 'create.confirm.cancel']).subscribe(t => {
            dialogs.confirm({
                title: t['create.confirm.title'],
                message: t['create.confirm.message'],
                okButtonText: t['create.confirm.ok'],
                cancelButtonText: t['create.confirm.cancel']
            }).then(result => {
                if (result) {
                    let tmpTran = this.walletService.getTempTransaction();
                    if (tmpTran) {
                        this.routerExtensions.navigate(['/home/transaction', {'tran': tmpTran}]);
                    } else {
                        this.routerExtensions.navigate(['/home/account'], {clearHistory: true});
                    }
                }
            });
        });

    }

    copy() {
        this.copied = true;
        clipboard.setText(this.mnemonic).then(() => {
            this.translateService.get('account.copied').subscribe((m) => {
                this.toastService.activate(<ToastMsg> {
                    message: m,
                    icon: null,
                    color: '#2CC93C',
                    timeout: 3000,
                    clbk: () => {
                        this.copied = false;
                    }
                });
            });
        });
    }
}
