import { Injectable, Optional, SkipSelf } from '@angular/core';

@Injectable()
export class AddressService {

    private _address: string;

    constructor(@Optional() @SkipSelf() prior: AddressService) {
        if (prior) {
            return prior;
        }
    }

    get address(): string {
        return this._address;
        // return '0x742d35cc6634c0532925a3b844bc454e4438f44e';
    }

    set address(value: string) {
        this._address = value;
    }
}
