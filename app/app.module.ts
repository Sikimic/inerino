import { NgModule, NgModuleFactoryLoader, NO_ERRORS_SCHEMA, APP_INITIALIZER } from '@angular/core';
import { NativeScriptModule } from 'nativescript-angular/nativescript.module';
import { NativeScriptFormsModule } from 'nativescript-angular/forms';
import { NativeScriptHttpModule } from 'nativescript-angular/http';
import { NativeScriptHttpClientModule } from 'nativescript-angular/http-client';
import { TranslateModule, TranslateLoader, MissingTranslationHandler } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import {
    HttpClient
} from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { WalletService } from './shared/wallet.service';
import { AuthGuard } from './shared/auth-guard.service';
import { SettingsService } from './shared/settings.service';
import { ConfigService } from './shared/config.service';
import { ToastService } from './shared/toast.service';
import { ToastComponent } from './pages/home/components/toast.component';
import { AppsFlyerService } from './shared/appsflyer.service';
import { TransactionsService } from './shared/transactions.service';
import { AddressService } from './shared/address.service';
import { DefaultLangMissingTranslationHandler } from './shared/missing-translations.handler';
import { MixpanelService } from './shared/mixpanel.service';
import { DBService } from './shared/db.service';
import { Erc20Service } from './shared/erc20.service';
import { QRService } from '~/shared/qr.service';
import { BarcodeScanner } from 'nativescript-barcodescanner';
import { FirebaseService } from '~/shared/firebase.service';

export function HttpLoaderFactory(http: HttpClient, config: ConfigService) {
    return new TranslateHttpLoader(http, config.getConf('locales'));
}
export function startupFactory(config: ConfigService): Function {
    return () => Promise.all([config.load()]);
}

@NgModule({
    bootstrap: [
        AppComponent
    ],
    imports: [
        NativeScriptModule,
        NativeScriptFormsModule,
        NativeScriptHttpModule,
        NativeScriptHttpClientModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient, ConfigService]
            },
            missingTranslationHandler: { provide: MissingTranslationHandler, useClass: DefaultLangMissingTranslationHandler },
        }),
        AppRoutingModule
    ],
    providers: [
        ConfigService,
        WalletService,
        ToastService,
        AuthGuard,
        SettingsService,
        AppsFlyerService,
        MixpanelService,
        TransactionsService,
        DBService,
        AddressService,
        Erc20Service,
        BarcodeScanner,
        QRService,
        FirebaseService,
        { provide: APP_INITIALIZER, useFactory: startupFactory, deps: [ConfigService], multi: true }],
    declarations: [
        AppComponent
    ],
    schemas: [
        NO_ERRORS_SCHEMA
    ]
})
export class AppModule { }
