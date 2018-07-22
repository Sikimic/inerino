import { Injectable, Optional, SkipSelf } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { ConfigService } from './config.service';
import { Couchbase } from 'nativescript-couchbase';
import { AddressService } from './address.service';

@Injectable()
export class DBService {
    private db: Couchbase;
    private _isInitialized: boolean = false;
    constructor(@Optional() @SkipSelf() prior: DBService,
        private httpClient: HttpClient,
        private addressService: AddressService,
        private config: ConfigService) {
        if (prior) {
            return prior;
        }
    }

    init() {
        this.db = new Couchbase(`t_${this.addressService.address.toLocaleLowerCase()}_db`);
        this._isInitialized = true;
    }

    destroy() {
        this.db.destroyDatabase();
    }

    get DB(): Couchbase {
        if (this._isInitialized) {
            return this.db;
        }
        return null;
    }

    get isInitialized(): boolean {
        return this._isInitialized;
    }
}
