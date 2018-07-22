import { Component, OnInit, AfterViewInit } from '@angular/core';
import { RouterExtensions } from 'nativescript-angular';
import { Page, isIOS, isAndroid } from 'ui/page';
import * as frameModule from 'ui/frame';
import * as _ from 'lodash';
import { TransactionsService } from '../../../shared/transactions.service';

@Component({
    selector: 'FilterTransactions',
    moduleId: module.id,
    templateUrl: './filter-transactions.component.html',
    styleUrls: ['./filter-transactions.component.css']
})
export class FilterTransactionsComponent implements OnInit, AfterViewInit {

    constructor(
        private page: Page,
        private routerExtensions: RouterExtensions,
        private transactionsService: TransactionsService) {

    }

    filter: any;
    tokens: Array<any> = [];

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
        this.filter = JSON.parse(JSON.stringify(this.transactionsService.filter));
        this.tokens = this.transactionsService.getTokensFromDBTransactions();
        // console.log(this.tokens);
        if (this.filter.tokens && this.filter.tokens.length === 1 && this.filter.tokens[0] === 'all') {
            this.filter.tokens = this.tokens.map(t => t.symbol);
        }
    }

    goBack() {
        this.routerExtensions.navigate(['/home/past-transactions'], {
            transition: {
                name: 'slideBottom'
            }
        });
    }

    checkToggle(path: string) {
        let val = _.get(this.filter, path, true);
        val = !val;
        _.set(this.filter, path, val);
    }

    isActive(path: string): boolean {
        return _.get(this.filter, path, true);
    }

    isTokenActive(symbol: string): boolean {
        return _.indexOf(this.filter.tokens, symbol) > -1;
    }

    toggleToken(symbol: string) {
        const isActive = this.isTokenActive(symbol);
        if (isActive) {
            _.pull(this.filter.tokens, symbol);
        } else {
            this.filter.tokens.push(symbol);
        }
    }

    apply() {
        const diff = _.difference(this.filter.tokens, this.tokens.map(t => t.symbol));
        if (diff.lenght === 0) {
            this.filter.tokens = ['all'];
        }
        this.transactionsService.applyFilter(this.filter);
        this.goBack();
    }

    reset() {
        this.transactionsService.resteFilter();
        this.goBack();
    }
}
