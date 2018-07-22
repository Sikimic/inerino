import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptCommonModule } from 'nativescript-angular/common';
import { NativeScriptHttpModule } from 'nativescript-angular/http';
import { NativeScriptHttpClientModule } from 'nativescript-angular/http-client';
import { NativeScriptFormsModule } from 'nativescript-angular/forms';

import { HomeRoutingModule } from './home-routing.module';
import { HomeComponent } from './home.component';
import { TransactionPreviewComponent } from './transactions/transaction-preview.component';
import { PastTransactionsComponent } from './transactions/past-transactions.component';
import { NavComponent } from './components/nav.component';
import { SettingsComponent } from './settings/settings.component';
import { TransactionComponent } from './components/transaction.component';
import { AboutComponent } from './settings/about.component';
import { GenericTextComponent } from './settings/generictext.component';
import { PartnersComponent } from './partners.component';
import { TranslateModule } from '@ngx-translate/core';
import { MinValueDirective } from '../../shared/input.directive';
import { CreateTransactionComponent } from './transactions/create-transaction.component';
import { GasComponent } from './components/gas.component';
import { NativeScriptUIListViewModule } from 'nativescript-ui-listview/angular';
import { SharedModule } from '../../shared/shared.module';
import { Erc20TokensComponent } from './settings/erc20/erc20tokens.component';
import { AddTokenComponent } from './settings/erc20/addtoken.component';
import { FilterTransactionsComponent } from './transactions/filter-transactions.component';

@NgModule({
    imports: [
        NativeScriptCommonModule,
        NativeScriptHttpModule,
        NativeScriptHttpClientModule,
        NativeScriptFormsModule,
        NativeScriptUIListViewModule,
        TranslateModule,
        HomeRoutingModule,
        SharedModule
    ],
    declarations: [
        HomeComponent,
        TransactionPreviewComponent,
        PastTransactionsComponent,
        NavComponent,
        SettingsComponent,
        TransactionComponent,
        AboutComponent,
        GenericTextComponent,
        PartnersComponent,
        MinValueDirective,
        CreateTransactionComponent,
        GasComponent,
        Erc20TokensComponent,
        AddTokenComponent,
        FilterTransactionsComponent
    ],
    schemas: [
        NO_ERRORS_SCHEMA
    ],
    providers: [
    ]
})
export class HomeModule { }
