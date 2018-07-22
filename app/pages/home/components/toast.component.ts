import { Component, OnInit, OnDestroy, ChangeDetectorRef, AfterViewChecked, Input } from '@angular/core';
import { ToastService, ToastMsg } from '../../../shared/toast.service';
import { Subscriber } from 'rxjs/Subscriber';
import { Subscription } from 'rxjs/Subscription';

@Component({
    selector: 'Toast',
    moduleId: module.id,
    templateUrl: './toast.component.html',
    styleUrls: ['./toast.component.css']
})

export class ToastComponent implements OnInit, OnDestroy, AfterViewChecked {

    isShow: boolean = false;
    @Input() msg: ToastMsg;
    private sub: Subscription;
    private timer: any = null;
    constructor(private toastService: ToastService, private changeDetectionRef: ChangeDetectorRef) {

    }
    ngOnInit() {
        if (this.msg != null) {
            this.setMessage();
        }
        this.sub = this.toastService.toastState.subscribe(m => {
            if (m != null) {
                this.msg = m;
                this.setMessage();
            } else {
                console.log(m);
            }
        });
    }

    private setMessage() {
        this.isShow = true;
        this.timer = setTimeout(() => {
            if (this.msg != null && this.msg.clbk) {
                this.msg.clbk();
            }
            this.isShow = false;
            this.msg = null;

        }, this.msg.timeout);
    }
    ngOnDestroy(): void {
        this.sub.unsubscribe();
        if (this.timer) {
            clearTimeout(this.timer);
        }
    }

    ngAfterViewChecked(): void {
        this.changeDetectionRef.detectChanges();
    }
}
