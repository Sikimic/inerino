import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { ToastComponent } from '../pages/home/components/toast.component';
import { NativeScriptCommonModule } from 'nativescript-angular/common';

@NgModule({
    imports: [
        NativeScriptCommonModule,
    ],
    declarations: [
        ToastComponent
    ],
    exports: [
        ToastComponent
    ],
    schemas: [
        NO_ERRORS_SCHEMA
    ]
})
export class SharedModule { }
