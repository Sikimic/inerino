import { Component, OnInit, Input, ChangeDetectionStrategy, Output, EventEmitter } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'Gas',
    moduleId: module.id,
    templateUrl: './gas.component.html',
    styleUrls: ['./gas.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class GasComponent implements OnInit {

    @Input() transactionPrice: number;
    @Input() ethRate: number;
    @Input() gas: number;
    @Input() gasPrice: number;
    @Input() balance: number;
    @Input() currencySymbol: string;
    @Output() change: EventEmitter<number> = new EventEmitter<number>();

    showExplain: boolean;
    constructor() { }

    ngOnInit(): void {

    }

    onChange(ev) {
        if (ev.value && Number.parseFloat(ev.value) !== Number.NaN) {
            this.change.emit(ev.value);
        }
    }

    toggleExplain() {
        this.showExplain = !this.showExplain;

    }
}
