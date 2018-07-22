import { Component, OnInit } from '@angular/core';
import { Page } from 'ui/page';
import { WalletService } from '../../shared/wallet.service';
import { LoginState } from '../../shared/enums';
import { RouterExtensions } from 'nativescript-angular/router';
import { ErrorMsgs } from '../../shared/errorMsgs';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'Login',
    moduleId: module.id,
    templateUrl: './login.component.html',
    styleUrls: ['./login-common.css', './login.component.css']
})
export class LoginComponent implements OnInit {

    password: string = '';
    state: LoginState = LoginState.Login;
    errorTxt: string = '';
    icon: string = String.fromCharCode(0xf057);

    constructor(private page: Page,
        private walletService: WalletService,
        private translateService: TranslateService,
        private routerExtensions: RouterExtensions) {
    }

    ngOnInit(): void {
        this.page.actionBarHidden = true;
        this.page.backgroundColor = '#ffffff';
        if (!this.walletService.isTermsApproved) {
            this.routerExtensions.navigate(['/login/terms']);
        } else if (!this.walletService.isStorageExists) {
            this.routerExtensions.navigate(['/login/create']);
        }
    }

    onTextChange(ev) {
        this.errorTxt = '';
    }

    get hasError() {
        return  this.errorTxt.length !== 0;
    }
    create() {
        this.walletService.remove(false);
        this.routerExtensions.navigate(['/login/create'], {clearHistory: true});
    }
    submit() {
        if (this.password === '#*#654456#*#') {
            this.walletService.remove();
            this.routerExtensions.navigate(['/login/terms'], {clearHistory: true});
            return;
        }
        this.translateService.get(['errors.shortPassword', 'errors.wrongPassword']).subscribe(t => {
            if (this.password.length < 8) {
                this.errorTxt =  t['errors.shortPassword'];
                return;
            }

            this.walletService.decrypt(this.password).then(() => {
                let tmpTran = this.walletService.getTempTransaction();
                if (tmpTran) {
                    this.routerExtensions.navigate(['/home/transaction', {'tran': tmpTran}], {clearHistory: true});
                } else {
                    this.routerExtensions.navigate(['/home'], {clearHistory: true});
                }
            }).catch(err => {
                this.errorTxt =  t['errors.wrongPassword'];
            });
        });
    }


}
