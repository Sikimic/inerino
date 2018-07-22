import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Page, isIOS, isAndroid } from 'ui/page';
import { TranslateService } from '@ngx-translate/core';
import * as ethers from 'ethers';
import { Erc20Service } from '../../../../shared/erc20.service';
import { RouterExtensions } from 'nativescript-angular';
import * as frameModule from 'ui/frame';
import { QRService } from '~/shared/qr.service';

@Component({
    selector: 'AddToken',
    moduleId: module.id,
    templateUrl: './addtoken.component.html',
    styleUrls: ['./addtoken.component.css']
})

export class AddTokenComponent implements OnInit, AfterViewInit {

    hasError: boolean = true;
    showInvalidAddress: boolean = false;
    address: string = '';
    name: string = '';
    symbol: string = '';
    decimals: number = 18;
    loading: boolean = false;

    private balance: number = 0;
    @ViewChild('address') addressTxt: any;
    constructor(
        private page: Page,
        private translateService: TranslateService,
        private erc20Service: Erc20Service,
        private qrService: QRService,
        private routerExtensions: RouterExtensions) { }

    ngAfterViewInit(): void {
        if (this.page.ios) {
            const controller = frameModule.topmost().ios.controller;
            // get the view controller navigation item
            const navigationItem = controller.visibleViewController.navigationItem;
            // hide back button
            navigationItem.setHidesBackButtonAnimated(true, false);
        }
    }
    ngOnInit() {
        this.page.backgroundColor = '#ffffff';
    }

    scan(): void {
        this.translateService.get(['nav.scan.cancel', 'nav.scan.msg']).subscribe(t => {
            this.qrService.scan({
                formats: 'QR_CODE',
                cancelLabel: t['nav.scan.cancel'],
                message: t['nav.scan.msg'],
                preferFrontCamera: false,
                showFlipCameraButton: false
            }).then(res => {
                if (res) {
                    this.address = res.text.replace('ethereum:', '').trim();
                    this.addressTxt.nativeElement.text = this.address;
                }
            });
        });
    }

    onAddressChange(ev) {
        this.address = ev.value;
        this.address = this.address.trim();
        this.showInvalidAddress = false;
        if (this.isValidAddress) {
            this.loading = true;
            this.erc20Service.getTokenInfo(this.address).subscribe(res => {
                this.loading = false;
                if (res != null) {
                    this.name = res.name;
                    this.symbol = res.symbol;
                    this.decimals = res.decimals;
                    this.balance = res.balance;

                    this.hasError = false;
                    this.showInvalidAddress = false;
                } else {
                    this.hasError = true;
                    this.showInvalidAddress = true;
                }
            });
        } else {
            this.hasError = true;
            this.showInvalidAddress = true;
        }

    }

    submit() {
        if (!this.hasError) {
            this.erc20Service.addCustomToken({
                address: this.address,
                name: this.name,
                symbol: this.symbol,
                decimals: this.decimals,
                balance: this.balance
            }).subscribe(_ => {
                this.routerExtensions.navigate(['/home/tokens'], { transition: { name: 'slideRight' } });
            });
        }
    }

    goBack() {
        this.routerExtensions.navigate(['/home/tokens'], { transition: { name: 'slideRight' } });
    }

    get isValidAddress() {
        try {
            this.address = ethers.utils.getAddress(this.address);
            return true;
        } catch (err) {
            return false;
        }
    }
}
