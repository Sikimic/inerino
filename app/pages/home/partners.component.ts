import { Component, OnInit } from '@angular/core';
import { RouterExtensions } from 'nativescript-angular/router';
import { Page } from 'ui/page';
import * as utils from 'utils/utils';
import { ConfigService } from '../../shared/config.service';


@Component({
    selector: 'Partners',
    moduleId: module.id,
    templateUrl: './partners.component.html',
    styleUrls: ['./partners.component.css']
})
export class PartnersComponent implements OnInit {

    constructor(private config: ConfigService,
        private page: Page) {

    }
    ngOnInit(): void {
        this.page.backgroundColor = '#ffffff';
    }

    dummy() {
    }


    gotoPartners() {
        utils.openUrl(this.config.getConf('partnersPage'));
    }
}
