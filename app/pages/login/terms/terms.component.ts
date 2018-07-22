import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Page } from 'ui/page';
import { WalletService } from '../../../shared/wallet.service';
import { RouterExtensions } from 'nativescript-angular/router';
import { WebView, LoadEventData } from 'ui/web-view';

@Component({
    selector: 'Terms',
    moduleId: module.id,
    templateUrl: './terms.component.html',
    styleUrls: ['./terms.component.css']
})

export class TermsComponent implements OnInit {
    constructor(private page: Page, private walletService: WalletService,
        private routerExtensions: RouterExtensions) { }

    @ViewChild('terms') webView: ElementRef;

    ngOnInit() {
        this.page.actionBarHidden = true;
        this.page.backgroundColor = '#ffffff';
        console.log(this.page.className);
        if (this.walletService.isTermsApproved) {
            if (this.walletService.isStorageExists) {
                this.routerExtensions.navigate(['/login']);
            } else {
                this.routerExtensions.navigate(['/login/create']);
            }
        }

        let webview: WebView = this.webView.nativeElement;
        if (webview.android) {
            webview.android.getSettings().setBuiltInZoomControls(false);
        }
    }

    onAcceptTerms(): void {
        this.walletService.setTermsApproved();
        if (this.walletService.isStorageExists) {
            this.routerExtensions.navigate(['/login']);
        } else {
            this.routerExtensions.navigate(['/login/create']);
        }
    }

    onScroll(ev) {

    }
}
