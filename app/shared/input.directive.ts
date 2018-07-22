import { Directive, Input } from '@angular/core';
import { NG_VALIDATORS, Validator, AbstractControl } from '@angular/forms';

@Directive({
    selector: '[minval]',
    providers: [{ provide: NG_VALIDATORS, useExisting: MinValueDirective, multi: true }]
})
export class MinValueDirective implements Validator {

    @Input() minval: number;

    public constructor() { }

    public validate(control: AbstractControl): { [key: string]: any } {
        let num = Number.parseFloat(control.value);
        return !control.value || this.minval > num
            ? null : { 'minval': true };
    }

}
