import { Injectable, Optional, SkipSelf } from '@angular/core';
import { Subject } from 'rxjs/Subject';

export interface ToastMsg {
    message: string;
    icon: string;
    color: string;
    timeout: number;
    clbk: Function;
}

@Injectable()
export class ToastService {

    private toastSubject = new Subject<ToastMsg>();
    toastState = this.toastSubject.asObservable();

    constructor(@Optional() @SkipSelf() prior: ToastService) {
        if (prior) {
            return prior;
        }
    }

    activate(msg: ToastMsg) {
        this.toastSubject.next(msg);
    }
}
