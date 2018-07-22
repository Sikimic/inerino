import { NgModule } from '@angular/core';
import { Routes } from '@angular/router';
import { NativeScriptRouterModule } from 'nativescript-angular/router';

import { HomeComponent } from './home.component';
import { TransactionPreviewComponent } from './transactions/transaction-preview.component';
import { PastTransactionsComponent } from './transactions/past-transactions.component';
import { AuthGuard } from '../../shared/auth-guard.service';
import { SettingsComponent } from './settings/settings.component';
import { AboutComponent } from './settings/about.component';
import { GenericTextComponent } from './settings/generictext.component';
import { PartnersComponent } from './partners.component';
import { CreateTransactionComponent } from './transactions/create-transaction.component';
import { Erc20TokensComponent } from './settings/erc20/erc20tokens.component';
import { AddTokenComponent } from './settings/erc20/addtoken.component';
import { FilterTransactionsComponent } from './transactions/filter-transactions.component';
const routes: Routes = [
    { path: '', redirectTo: 'account', pathMatch: 'full' },
    { path: 'account', component: HomeComponent },
    { path: 'transaction', component: TransactionPreviewComponent },
    { path: 'past-transactions', component: PastTransactionsComponent },
    { path: 'create-transaction', component: CreateTransactionComponent },
    { path: 'settings', component: SettingsComponent },
    { path: 'about', component: AboutComponent },
    { path: 'terms', component: GenericTextComponent },
    { path: 'privacy', component: GenericTextComponent },
    { path: 'partners', component: PartnersComponent },
    { path: 'tokens', component: Erc20TokensComponent },
    { path: 'add-token', component: AddTokenComponent },
    { path: 'filter-transactions', component: FilterTransactionsComponent },
];

@NgModule({
    imports: [NativeScriptRouterModule.forChild(routes)],
    exports: [NativeScriptRouterModule]
})
export class HomeRoutingModule { }
