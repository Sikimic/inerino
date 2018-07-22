import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptCommonModule } from 'nativescript-angular/common';
import { NativeScriptFormsModule } from 'nativescript-angular/forms';
import { NativeScriptHttpModule } from 'nativescript-angular/http';
import { TranslateModule } from '@ngx-translate/core';
import { LoginRoutingModule } from './login-routing.module';
import { LoginComponent } from './login.component';
import { CreateComponent } from './create.component';
import { RestoreComponent } from './restore.component';
import { TermsComponent } from './terms/terms.component';
import { ChangePasswordComponent } from './change-password.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
    imports: [
        NativeScriptCommonModule,
        NativeScriptFormsModule,
        NativeScriptHttpModule,
        TranslateModule,
        LoginRoutingModule,
        SharedModule
    ],
    declarations: [
        LoginComponent,
        CreateComponent,
        RestoreComponent,
        TermsComponent,
        ChangePasswordComponent,
    ],
    schemas: [
        NO_ERRORS_SCHEMA
    ]
})
export class LoginModule { }
