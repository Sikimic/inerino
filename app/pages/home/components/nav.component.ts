import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'Nav',
    moduleId: module.id,
    templateUrl: './nav.component.html',
    styleUrls: ['./nav.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class NavComponent implements OnInit {

    constructor() {

    }
    @Input() activePage: string = 'account';
    ngOnInit() {

    }
}
