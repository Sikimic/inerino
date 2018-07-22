import { NgModule } from '@angular/core';
import { Routes } from '@angular/router';
import { NativeScriptRouterModule } from 'nativescript-angular/router';

import { LoginComponent } from './login.component';
import { CreateComponent } from './create.component';
import { RestoreComponent } from './restore.component';
import { TermsComponent } from './terms/terms.component';
import { ChangePasswordComponent } from './change-password.component';

const routes: Routes = [
    { path: '', component: LoginComponent },
    { path: 'create', component: CreateComponent },
    { path: 'restore', component: RestoreComponent },
    { path: 'terms', component: TermsComponent },
    { path: 'change-pass', component: ChangePasswordComponent },
];

@NgModule({
    imports: [NativeScriptRouterModule.forChild(routes)],
    exports: [NativeScriptRouterModule]
})
export class LoginRoutingModule { }
