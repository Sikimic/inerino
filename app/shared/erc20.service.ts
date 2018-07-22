import { Injectable, Optional, SkipSelf } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from './config.service';
import { DBService } from './db.service';
import { SettingsService } from './settings.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/fromPromise';
import { AddressService } from './address.service';
import * as cheerio from 'cheerio-without-node-native';
import * as ethers from 'ethers';
import * as _ from 'lodash';
import * as ImageSource from 'image-source';

const abi = require('human-standard-token-abi');
const erc20 = require('../tools/erc20.json');

@Injectable()
export class Erc20Service {
    private _erc20List: any = erc20;
    private _erc20: any = {};
    private provider: any;
    constructor(@Optional() @SkipSelf() prior: Erc20Service,
        private httpClient: HttpClient,
        private dbService: DBService,
        private settingsService: SettingsService,
        private addressService: AddressService,
        private config: ConfigService) {
        if (prior) {
            return prior;
        }

        this.checkForErc20Update();
    }

    setProvider(p: any) {
        this.provider = p;
    }

    private createDefaultErc20() {
        this._erc20 = {};
        this._erc20[this.config.getConf('token.address')] = {
            default: true,
            index: 0,
            symbol: 'PMA',
            name: 'PumaPay',
            ico: this.config.getConf('erc20.pmaicon', 'https://s3-eu-west-1.amazonaws.com/pumawalet.locales/icons/pma.png'),
            decimals: 18
        };
        this._erc20['0x'] = {
            default: true,
            index: 1,
            symbol: 'ETH',
            name: 'Ethereum',
            ico: this.config.getConf('erc20.ethicon', 'https://s3-eu-west-1.amazonaws.com/pumawalet.locales/icons/eth.png'),
            decimals: 18
        };
    }

    initErc20DB() {
        if (this.addressService.address !== '' && this.dbService.isInitialized) {
            const erc20 = this.dbService.DB.getDocument('erc20_' + this.settingsService.networkid);
            if (erc20) {
                this._erc20 = erc20.data;
            } else {
                this.createDefaultErc20();
                let index = 2;
                if (this.config.getConf('erc20.webscrap.use', true)) {
                    this.httpClient.get(
                        this.config.getConf('erc20.webscrap.account_tokens', 'https://etherscan.io/address/{{address}}').
                            replace('{{address}}', this.addressService.address), { responseType: 'text' }
                    ).catch(err => {
                        return Observable.of(null);
                    }).subscribe(body => {
                        const $ = cheerio.load(body);
                        const tokens = $('#balancelist > li > a');
                        for (let i = 0, len = tokens.length; i < len; i++) {
                            const href = $(tokens[i]).attr('href');
                            const address = href.substring(7, href.indexOf('?')).toLowerCase();
                            if (this._erc20List[this.network][address]) {
                                this._erc20[address] = this._erc20List[this.network][address];
                                this._erc20[address].index = index;
                                index++;
                            }
                        }
                        this.dbService.DB.createDocument(
                            { type: 'erc20_account_tokens', data: this._erc20 },
                            'erc20_' + this.settingsService.networkid);
                    });
                } else {
                    this.httpClient.get(this.config.getConf('erc20.account_tokens')).catch(err => {
                        return Observable.of(null);
                    }).subscribe(res => {
                        if (res) {
                            const data = res.data ? res.data : res;
                            this._erc20 = Object.assign(this._erc20, data);
                        }

                        this.dbService.DB.createDocument(
                            { type: 'erc20_account_tokens', data: this._erc20 },
                            'erc20_' + this.settingsService.networkid);
                    });
                }
            }
        }
    }

    private checkForErc20Update() {
        this.httpClient.get(this.config.getConf('erc20.update', 'https://s3-eu-west-1.amazonaws.com/pumawalet.locales/erc20.json'))
            .catch(err => {
                return Observable.of(null);
            })
            .subscribe(res => {
                if (res) {
                    const data = res.data ? res.data : res;
                    this._erc20List = _.merge(this._erc20List, data);
                }
            });
    }

    formatUnits(value, decimals: number): any {
        value = ethers.utils.bigNumberify(value);
        const negative = value.lt(ethers.utils.bigNumberify(0));
        if (negative) { value = value.mul(ethers.utils.bigNumberify(-1)); }
        const tenPower = ethers.utils.bigNumberify('1' + Array(decimals + 1).join('0'));
        let fraction = value.mod(tenPower).toString(10);
        while (fraction.length < decimals) { fraction = '0' + fraction; }

        fraction = fraction.match(/^([0-9]*[1-9]|0)(0*)/)[1];

        const whole = value.div(tenPower).toString(10);

        let res = whole + '.' + fraction;

        if (negative) { value = '-' + value; }

        return res;
    }

    private getRates(tokensBySymbol: any) {
        const currency = this.settingsService.currency.toUpperCase();
        let url = this.config.getConf('erc20.ratesservice', 'https://min-api.cryptocompare.com/data/pricemulti?fsyms={{crypto}}&tsyms={{currency}}');
        url = url.replace('{{crypto}}', Object.keys(tokensBySymbol).join());
        url = url.replace('{{currency}}', currency);
        return new Promise((resolve, reject) => {
            this.httpClient.get(url).subscribe(res => {
                let rates: any = {};
                for (let i of Object.keys(res)) {
                    rates[tokensBySymbol[i]] = { rate: res[i][currency] };
                }
                resolve(rates);
            });
        });

    }

    getRatesByTokens(tokens: Array<string>): Promise<any> {
        const currency = this.settingsService.currency.toUpperCase();
        let tokensBySymbol: any = {
            'ETH': '0x',
            'PMA': this.config.getConf('token.address')
        };
        for (let t of tokens) {
            let token = this._erc20List[this.network][t] || this._erc20[t];
            if (token) {
                tokensBySymbol[token.symbol] = t;
            }
        }

        return this.getRates(tokensBySymbol).then(rates => {
            for (let t of Object.keys(rates)) {
                let token = this._erc20List[this.network][t] || this._erc20[t];
                rates[t].decimals = token.decimals;
            }
            return rates;
        });
    }

    getTokenByAddress(address: string): any {
        let token = this._erc20List[this.network][address];
        if (!token) {
            token = this._erc20[address];
            if (token) {
                token.selected = true;
            }
        }
        return token;
    }

    selectedTokensWithBalances() {
        let addresses = Object.keys(this._erc20);
        let tokensBySymbol: any = {};
        for (let t of Object.keys(this._erc20)) {
            tokensBySymbol[this._erc20[t].symbol] = t;
        }
        let promises = [this.getRates(tokensBySymbol)];
        promises.push(...addresses.map(address => {
            if (address === '0x') {
                return new Promise((resolve, reject) => {
                    this.provider.getBalance(this.addressService.address).then(b => {
                        resolve({
                            address: '0x',
                            balance: ethers.utils.formatEther(b)
                        });
                    });
                });
            }
            const contract = new ethers.Contract(address, abi, this.provider);
            return new Promise((resolve, reject) => {
                contract.balanceOf(this.addressService.address).catch(err => '0').then(b => {
                    const balance = (b.balance) ? (this.formatUnits(b.balance, this._erc20[address].decimals) / 1) :
                        (this.formatUnits(b, this._erc20[address].decimals) / 1);
                    resolve({
                        address: address, balance: balance
                    });
                });
            });
        }));
        return Observable.fromPromise(Promise.all(promises).then((blns: Array<any>) => {
            let balances: any = {};
            const rates = blns[0];
            for (let i = 1; i < blns.length; i++) {
                const b = blns[i];
                balances[b.address] = b.balance;
            }
            let tokens = addresses.map(address => {
                let rate = (rates[address] || { rate: 0 }).rate;
                if (rate === 0 && address === this.config.getConf('token.address')) {
                    rate = rates['0x'].rate / this.config.getConf('PMAETHRate');
                }
                return Object.assign({ address: address, balance: balances[address], rate: rate }, this._erc20[address]);
            });

            tokens.sort((a, b) => a.index - b.index);
            return tokens;
        }));

    }

    supportedTokensArray() {
        const list = this._erc20List[this.network];
        const selected = Object.keys(this._erc20);
        let arr = Object.keys(list).map(address => {
            return Object.assign({ address: address, selected: selected.indexOf(address) !== -1 }, list[address]);
        });

        arr.push(...Object.keys(this._erc20).filter(address => {
            return this._erc20[address].custom;
        }).map(address => {
            return Object.assign({ address: address, selected: true }, this._erc20[address]);
        }));

        return arr;
    }
    isInList(address: string): boolean {
        const list = this._erc20List[this.network];
        return list[address];
    }

    updateTokenIndex(address: string, index: number) {
        const token = this._erc20[address];
        if (token && token.index !== index) {
            const addresses = Object.keys(this._erc20);
            for (let t = 0; t < addresses.length; t++) {
                if (addresses[t] === address) {
                    continue;
                }
                if (token.index > index && this._erc20[addresses[t]].index >= index && this._erc20[addresses[t]].index < token.index) {
                    this._erc20[addresses[t]].index++;
                }

                if (token.index < index && this._erc20[addresses[t]].index > token.index && this._erc20[addresses[t]].index <= index) {
                    this._erc20[addresses[t]].index--;
                }
            }
            this._erc20[address].index = index;
        }

        this.storerc20toDB();
    }

    private storerc20toDB() {
        const doc = this.dbService.DB.getDocument('erc20_' + this.settingsService.networkid);
        if (doc === null) {
            this.dbService.DB.createDocument(
                { type: 'erc20_account_tokens', data: this._erc20 },
                'erc20_' + this.settingsService.networkid);
        } else {
            doc.data = this._erc20;
            this.dbService.DB.updateDocument('erc20_' + this.settingsService.networkid, doc);
        }
    }

    toggleTokenSelection(address: string) {
        const token = this._erc20[address];
        if (token) {
            delete this._erc20[address];
            const addresses = Object.keys(this._erc20);
            for (let t = 0; t < addresses.length; t++) {
                if (this._erc20[addresses[t]].index > token.index) {
                    this._erc20[addresses[t]].index--;
                }
            }
        } else {
            this._erc20[address] = this._erc20List[this.network][address];
            this._erc20[address].index = Object.keys(this._erc20).length - 1;
        }
        this.storerc20toDB();

    }

    addToken(address: string) {
        const token = this._erc20[address];
        if (!token) {
            this.toggleTokenSelection(address);
        }
    }

    addCustomToken(data: any) {
        let token: any = {
            custom: true,
            balance: data.balance,
            name: data.name,
            symbol: data.symbol,
            decimals: data.decimals
        };
        return Observable.fromPromise(new Promise((resolve, reject) => {
            const iconUrl = this.config.getConf('erc20.tokenicon', 'https://s3-eu-west-1.amazonaws.com/pumawalet.locales/icons/images/{{address}}.png').
                replace('{{address}}', data.address.toLowerCase());

            new Promise((resolve, reject) => {
                ImageSource.fromUrl(iconUrl).then((image) => {
                    resolve(true);
                }).catch(err => {
                    resolve(false);
                });
            }).then(res => {
                token.ico = !res ? this.getDefaultIcon() : iconUrl;


                this._erc20[data.address] = token;
                this._erc20[data.address].index = Object.keys(this._erc20).length - 1;

                this.storerc20toDB();
                resolve();
            });
            // });
        }));
    }

    private getDefaultIcon() {
        return this.config.getConf('erc20.defaulticon', 'https://s3-eu-west-1.amazonaws.com/pumawalet.locales/icons/eth.png');
    }

    getTokenInfo(address: string): Observable<any> {
        const contract = new ethers.Contract(address, abi, this.provider);
        return Observable.fromPromise(Promise.all([
            contract.name().catch(err => ''),
            contract.symbol().catch(err => ''),
            contract.decimals().catch(err => 18),
            contract.balanceOf(this.addressService.address).catch(err => err)
        ]).then(val => {

            for (let i = 0, len = val.length; i < len; i++) {
                if (val[i] instanceof Array) {
                    val[i] = val[i][0];
                }
            }
            if (val[3]['code'] && val[3]['code'] === 'CALL_EXCEPTION') {
                return null;
            }
            const balance = (val[3].balance) ? (ethers.utils.formatEther(val[3].balance) / 1) : (ethers.utils.formatEther(val[3]) / 1);
            return {
                address: address,
                name: val[0],
                symbol: val[1],
                decimals: val[2],
                balance: balance
            };
        }));
    }


    private get network() {
        switch (this.settingsService.networkid) {
            default:
            case 3: return 'ropsten';
            case 1: return 'mainnet';
        }
    }

}
