import { MissingTranslationHandler, MissingTranslationHandlerParams } from '@ngx-translate/core';
import * as at from 'lodash/at';
const defaultLang = require('../tools/locales/en.json');

export class DefaultLangMissingTranslationHandler implements MissingTranslationHandler {
    handle(params: MissingTranslationHandlerParams) {

        let res = at(defaultLang, params.key);
        if (res && res.length > 0 && res[0]) {
            let val = <string>res[0];
            if (params.interpolateParams) {
                Object.keys(params.interpolateParams).forEach(p => {
                    val = val.replace(new RegExp('\{\{' + p + '\}\}', 'gi'), params.interpolateParams[p]);
                });
            }
            return val;
        }
        return params.key;
    }
}
