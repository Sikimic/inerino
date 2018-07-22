

import { Injectable, SkipSelf, Optional } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/observable/timer';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/toPromise';

import { SecureStorage } from 'nativescript-secure-storage';
require('nativescript-nodeify');
import * as ethers from 'ethers';
import * as base64 from 'base64-js';
import { NSCrypto } from 'nativescript-crypto';
import * as moment from 'moment';
import { Transaction, TempTransaction, Signature, TransactionStatus, TransactionType, DBTransction } from './transaction.model';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ConfigService } from './config.service';
import { SettingsService } from './settings.service';
import { ToastService, ToastMsg } from './toast.service';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs/Subject';
import { AddressService } from './address.service';
import { TransactionsService } from './transactions.service';


const defaultPath = 'm/44\'/60\'/0\'/0/0';
const crypto = new NSCrypto();
@Injectable()
export class WalletService {

    storage: SecureStorage;
    wallet: any;
    contract: any;
    tempTransction: TempTransaction;
    iface: any;
    transferInfo: any;
    lastSynced: any = moment().subtract(7, 'days');
    private _transactionInFrogress: boolean = false;

    private crrpageSubject: BehaviorSubject<string> = new BehaviorSubject<string>('account');
    crrpage: Observable<string> = this.crrpageSubject.asObservable();

    constructor(@Optional() @SkipSelf() prior: WalletService,
        private http: HttpClient,
        private config: ConfigService,
        private settingsService: SettingsService,
        private toastService: ToastService,
        private addressService: AddressService,
        private transactionsService: TransactionsService,
        private translateService: TranslateService) {
        if (prior) { return prior; }

        this.storage = new SecureStorage();
        this.iface = new ethers.Interface(this.config.getConf('token.abi'));
        this.transferInfo = this.iface.functions.transfer('0x0000000000000000000000000000000000000000', 0);

    }

    get transactionInFrogress() {
        return this._transactionInFrogress;
    }
    set transactionInFrogress(val: boolean) {
        this._transactionInFrogress = val;
    }
    get isTermsApproved(): boolean {
        return this.storage.getSync({
            key: this.config.getConf('storageTermsKey')
        }) !== null;
    }

    setCrrPage(page: string) {
        this.crrpageSubject.next(page);
    }

    setTermsApproved(): void {
        this.storage.setSync({
            key: this.config.getConf('storageTermsKey'),
            value: 'true'
        });
    }

    get isStorageExists(): boolean {
        return this.storage.getSync({
            key: this.config.getConf('storageKey')
        }) !== null;
    }

    get balance() {
        if (this.wallet) {
            return this.wallet.getBalance().then(b => {
                return ethers.utils.formatEther(b);
            });
        }
        return Promise.resolve(0);
    }

    get tokenBalance() {
        if (this.contract) {
            return this.contract.balanceOf(this.wallet.address).then(b => {
                if (b.balance) {
                    return ethers.utils.formatEther(b.balance) / 1;
                }
                return ethers.utils.formatEther(b) / 1;
            });
        }
        return Promise.resolve(0);
    }

    decrypt(password: string) {
        return new Promise((resolve, reject) => {
            try {
                this._decrypt(password);
            } catch (err) {
                reject(err);
            }

            this.wallet.provider = new ethers.providers.JsonRpcProvider(this.config.getConf('jsonrpc'), this.ethersNetwork);
            // this.wallet.provider = new ethers.providers.InfuraProvider(this.ethersNetwork, this.config.getConf('infuraApiKey'));
            this.addressService.address = this.wallet.address;
            this.transactionsService.init();
            this.contract = new ethers.Contract(this.config.getConf('token.address'), this.config.getConf('token.abi'), this.wallet);
            resolve();
        });
    }
    changePassword(password: string) {
        this._encrypt(password);
    }
    checkPassword(password: string) {
        return new Promise<boolean>((resolve) => {
            try {
                this._decrypt(password);
            } catch (err) {
                resolve(false);
            }
            resolve(true);
        });
    }

    remove(withterm: boolean = true) {
        this.storage.removeSync({
            key: this.config.getConf('storageKey')
        });
        if (withterm) {
            this.storage.removeSync({
                key: this.config.getConf('storageTermsKey')
            });
        }
        this.storage.removeSync({ key: this.config.getConf('storageTransactionsKey') });
        this.addressService.address = '';
    }

    restore(mnemonic: string, password: string) {
        this.storage.removeSync({ key: this.config.getConf('storageTransactionsKey') });
        return new Promise((resolve, reject) => {
            if (ethers.HDNode.isValidMnemonic(mnemonic)) {
                this.wallet = ethers.Wallet.fromMnemonic(mnemonic, defaultPath);
                this.addressService.address = this.wallet.address;
                this.transactionsService.init();
                this.wallet.provider = new ethers.providers.JsonRpcProvider(this.config.getConf('jsonrpc'), this.ethersNetwork);
                // this.wallet.provider = new ethers.providers.InfuraProvider(this.ethersNetwork, this.config.getConf('infuraApiKey'));
                this.contract = new ethers.Contract(this.config.getConf('token.address'), this.config.getConf('token.abi'), this.wallet);
                this._encrypt(password);
                resolve();
            } else {
                reject();
            }
        });
    }

    isValidMnemonic(mnemonic: string) {
        return ethers.HDNode.isValidMnemonic(mnemonic);
    }

    create(password: string): string {
        this.storage.removeSync({ key: this.config.getConf('storageTransactionsKey') });
        // const entropy = this._unicodeStringToTypedArray(crypto.secureRandomBytes(16));
        const entropy = base64.toByteArray(crypto.secureRandomBytes(16) + '');
        const mnemonic = ethers.HDNode.entropyToMnemonic(entropy);
        this.wallet = ethers.Wallet.fromMnemonic(mnemonic, defaultPath);
        this.addressService.address = this.wallet.address;
        this.transactionsService.init();
        this.wallet.provider = new ethers.providers.JsonRpcProvider(this.config.getConf('jsonrpc'), this.ethersNetwork);
        // this.wallet.provider = new ethers.providers.InfuraProvider(this.ethersNetwork, this.config.getConf('infuraApiKey'));
        this.contract = new ethers.Contract(this.config.getConf('token.address'), this.config.getConf('token.abi'), this.wallet);
        this._encrypt(password);

        return mnemonic;
    }

    changeNetwork() {
        this.wallet.provider = new ethers.providers.JsonRpcProvider(this.config.getConf('jsonrpc'), this.ethersNetwork);
        // this.wallet.provider = new ethers.providers.InfuraProvider(this.ethersNetwork, this.config.getConf('infuraApiKey'));
        this.contract = new ethers.Contract(this.config.getConf('token.address'), this.config.getConf('token.abi'), this.wallet);

        this.transactionsService.onNetworkChanged();
    }

    private get ethersNetwork() {

        switch (this.settingsService.networkid) {
            default:
            case 3: return ethers.providers.networks.ropsten;
            case 1: return ethers.providers.networks.mainnet;
        }
    }

    syncTransactions() {

        if (!moment().isAfter(this.lastSynced.add(10, 'minutes'))) {
            return;
        }
        let tran = this.getTransactionsFromStorage();
        this.http.get(this.config.getConf('etherscanHistoryApi') + this.wallet.address).subscribe(res => {
            const history = <any>res;
            if (history && history.status === '1' && history.result && history.result.length > 0) {
                const outh = history.result.filter(h =>
                    h.from === this.wallet.address.toLowerCase() && h.to === this.config.getConf('token.address').toLowerCase());
                if (outh.length > 0) {
                    for (let th of outh) {
                        let ti = tran.findIndex(t => t.hash === th.hash);
                        if (ti !== -1) {
                            if (!tran[ti].chainTransaction || !tran[ti].chainTransaction.synced) {
                                tran[ti].chainTransaction = {
                                    synced: true,
                                    status: th.txreceipt_status,
                                    gasUsed: th.gasUsed,
                                    gasPrice: th.gasPrice
                                };
                            }
                        } else {
                            tran.push(this.decodeTransactionFromHistory(th));
                        }
                    }

                    this.storage.setSync({
                        key: this.config.getConf('storageTransactionsKey'),
                        value: JSON.stringify(tran)
                    });
                    this.lastSynced = moment();
                }
            }
        });
    }

    private decodeTransactionFromHistory(history: any): Transaction {

        let to = '';
        let value = '0';
        let type = TransactionType.ETH;
        if (history.input.indexOf(this.transferInfo.sighash) !== -1) {
            const data = ethers.Interface.decodeParams(['address', 'uint256'], '0x' + history.input.replace(this.transferInfo.sighash, ''));
            to = data[0];
            value = data[1].toString();
            type = TransactionType.PMA;
        } else {
            to = history.to;
            value = history.value;
        }

        return <Transaction>{
            to: to,
            value: value,
            description: '',
            name: '',
            pic: '',
            data: history.input,
            hash: history.hash,
            callback: '',
            date: new Date(parseInt(history.timeStamp) * 1000),
            signature: '',
            networkid: 3,
            type: type,
            chainTransaction: {
                synced: true,
                status: history.txreceipt_status,
                gasUsed: history.gasUsed,
                gasPrice: history.gasPrice,
                from: history.from
            }
        };
    }

    validateTransaction(transaction: Transaction): boolean {
        transaction.isValid = false;
        try {
            const pk = this.ecRecover(transaction);
            // TODO: add validation in front of smart contract
            transaction.isValid = (<Array<string>>this.config.getConf('validSigners')).indexOf(pk) !== -1;
        } catch (err) {
            console.log(err);
        }
        return transaction.isValid;
    }

    private ecRecover(transaction: Transaction): string {
        const hash = Buffer.from(ethers.utils.solidityKeccak256(['bytes', 'bytes', 'bytes', 'uint256', 'address', 'uint256'],
            [
                Buffer.from(transaction.callback, 'utf8'),
                Buffer.from(transaction.description, 'utf8'),
                Buffer.from(transaction.name, 'utf8'),
                transaction.networkid,
                transaction.to,
                transaction.value
            ]).substr(2), 'hex');

        const digest = ethers.utils.keccak256(Buffer.concat([new Buffer('\x19Ethereum Signed Message:\n'), new Buffer(String(hash.length)), hash]));
        const sig = this.extractEcdsaSignature(transaction.signature);
        const pk = ethers.SigningKey.recover(digest, sig.r, sig.s, this.getRecIdFromV(sig.v)).toLowerCase();
        return pk;
    }
    private getRecIdFromV(v: number): number {
        let header = v;
        // The header byte: 0x1B = first key with even y, 0x1C = first key with odd y,
        //                  0x1D = second key with even y, 0x1E = second key with odd y
        if ((header < 27) || (header > 34)) {

            // throw new Error("Header byte out of range: " + header);
            return header;
        }
        if (header >= 31) {
            header -= 4;
        }

        return header - 27;
    }

    private extractEcdsaSignature(signature: string): Signature {
        return <Signature>{
            r: Buffer.from(signature.slice(2, 66), 'hex'),
            s: Buffer.from(signature.slice(66, 130), 'hex'),
            v: parseInt('0x' + signature.slice(130, 132), 16)
        };
    }

    private createTransactionData(transaction: Transaction): void {
        const iface = new ethers.Interface(this.config.getConf('token.abi'));
        const transferInfo = iface.functions.transfer(transaction.to, transaction.value);
        transaction.data = transferInfo.data;
    }

    gaspriceEstimation() {
        return this.http.get(this.config.getConf('gaspriceEstimation')).map(est => {
            return Number.parseFloat(est['average']) / 10;
        }).catch(er => {
            return Observable.of(21);
        });
    }

    estimateGas(transaction: Transaction) {
        if (!transaction.data) {
            this.createTransactionData(transaction);
        }
        const chainTransaction = {
            gasLimit: 300000,
            to: transaction.token ? transaction.token.address : this.config.getConf('token.address'),
            data: transaction.data
        };
        return this.wallet.estimateGas(chainTransaction);
    }

    sendTransaction(transaction: Transaction, gasLimit: any, gasPrice: any) {

        let token = transaction.token;
        let to, data, value;
        if ((token && token.symbol !== 'ETH') || transaction.type === TransactionType.PMA) {
            to = token ? token.address : this.config.getConf('token.address');
            data = transaction.data;
            value = ethers.utils.bigNumberify('0');
            transaction.token = token || { symbol: 'PMA', address: to };
        } else {
            to = transaction.to;
            data = '';
            value = ethers.utils.bigNumberify(transaction.value);
            transaction.token = token || { symbol: 'ETH', address: '' };
        }
        const chainTransaction = {
            gasLimit: gasLimit,
            gasPrice: gasPrice,
            to: to,
            data: data,
            value: value
        };

        this.transactionInFrogress = true;
        return this.wallet.sendTransaction(chainTransaction).then(res => {

            transaction.hash = res.hash;
            transaction.chainTransaction = {
                hash: res.hash,
                gasPrice: gasPrice.toString(),
                gasUsed: gasLimit.toString(),
                status: -1
            };
            transaction.date = new Date();
            // this.saveTransactionInStorage(transaction)
            const dbTx = this.transactionsService.createTransaction(transaction);
            return this.sendTransactionCallback(dbTx).toPromise().then(r => {
                return transaction;
            }).catch(err => {
                return transaction;
            });
        });
    }

    private transactionSubject = new Subject<Transaction>();
    transactionState = this.transactionSubject.asObservable();

    trackTransactionStatus(hash: string) {
        const sub = this.getTransactionStatus(hash).subscribe((chainTransaction) => {
            if (chainTransaction !== null) {
                sub.unsubscribe();

                let transaction = this.transactionsService.getTx(hash);
                transaction.status = chainTransaction.status;
                transaction.gasUsed = chainTransaction.gasUsed.toString();
                this.transactionsService.updateTransaction(transaction);
                // this.updateTransactionInStorage(transaction);
                // this.transactionSubject.next(transaction);
                this.sendTransactionCallback(transaction).subscribe(r => { });
                this.translateService.get(['transactionpreview.accepted', 'transactionpreview.declined']).subscribe(t => {
                    this.toastService.activate(<ToastMsg>{
                        message: t[(chainTransaction.status === 0 ? 'transactionpreview.declined' : 'transactionpreview.accepted')],
                        color: chainTransaction.status === 0 ? '#E01A0D' : '#2CC93C',
                        icon: null,
                        timeout: 5000,
                        clbk: null
                    });
                });
            }
        });
    }

    getTransactionStatus(hash: string): Observable<any> {
        return Observable.timer(0, this.config.getConf('getTransactionStatusInterval')).switchMap((i) => {
            return Observable.fromPromise(this.wallet.provider.getTransactionReceipt(hash));
        });
    }

    getEthRate(symbol: string): Observable<number> {
        return this.http.get(this.config.getConf('symbolTicker') + symbol).map(res => {
            return <number>res['ask'];
        });
    }

    getPMARate(): Observable<number> {
        return Observable.of(this.config.getConf('PMAETHRate'));
    }

    getTransactionsFromStorage(): Transaction[] {
        let tran: Transaction[] = [];
        let fromStorage = this.storage.getSync({ key: this.config.getConf('storageTransactionsKey') });
        if (fromStorage) {
            tran = JSON.parse(fromStorage);
        }

        tran = tran.sort((a, b) => {
            a.date = a.date || new Date(2018, 1, 1);
            b.date = b.date || new Date(2018, 1, 1);
            if (a.date < b.date) {
                return 1;
            } else if (a.date > b.date) {
                return -1;
            }
            return 0;
        });
        return tran;
    }
    private getStatus(transaction: DBTransction): TransactionStatus {
        if (!transaction.hash) {
            return TransactionStatus.Scaned;
        }
        if (transaction.status === -1) {
            return TransactionStatus.Open;
        }
        return transaction.status === 1 ? TransactionStatus.Approved : TransactionStatus.Declined;
    }

    sendTransactionCallback(transaction: DBTransction, status?: TransactionStatus): Observable<Object> {
        if (transaction.callback) {
            if (!status) {
                status = this.getStatus(transaction);
            }
            const hash = transaction.hash || '';
            const url = (transaction.callback.indexOf('{0}') !== -1 ? (transaction.callback.replace('{0}', hash) + '&fromapp=1' + '&status=' + status) :
                `${transaction.callback}${transaction.callback.indexOf('?') !== -1 ? '&' : '?'}tx=${hash}&fromapp=1&status=${status}`);
            try {
                return this.http.get(
                    url,
                    { responseType: 'text' }
                ).catch(er => {
                    return Observable.of('');
                });
            } catch (err) {
                console.log(err);
            }
        }
        return Observable.of(null);
    }

    getTransactionByHash(hash: string): Transaction {
        let tran: Transaction[] = this.getTransactionsFromStorage();

        const ind = tran.findIndex((t) => {
            return t.hash === hash;
        });
        if (ind === -1) {
            return null;
        }
        return tran[ind];
    }

    updateTransactionInStorage(transaction: Transaction) {
        let tran: Transaction[] = this.getTransactionsFromStorage();

        const ind = tran.findIndex((t) => {
            return t.hash === transaction.hash;
        });

        if (ind !== -1) {
            tran[ind] = transaction;
        } else {
            tran.push(transaction);
        }
        this.storage.setSync({
            key: this.config.getConf('storageTransactionsKey'),
            value: JSON.stringify(tran)
        });
    }

    storeTempTransaction(tran: string) {
        this.tempTransction = <TempTransaction>{ tran: tran, date: new Date() };
    }

    getTempTransaction(): string {
        let tran = null;
        if (this.tempTransction && moment(this.tempTransction.date).isAfter(moment().subtract(1, 'd'))) {
            tran = this.tempTransction.tran;
        }
        this.tempTransction = null;
        return tran;
    }

    getTransactionFromParams(param: string): Observable<Transaction> {
        try {
            let stran = this.decodeBase64Transaction(param);
            let tranObj = JSON.parse(stran);
            if (tranObj.url) {
                return this.http.get<Transaction>(tranObj.url);
            } else {
                tranObj.type = tranObj.type || TransactionType.PMA;
                return Observable.of(<Transaction>tranObj);
            }
        } catch (err) {
            return Observable.of(null);
        }

    }

    decodeBase64Transaction(tran: string) {
        if (/^[A-Za-z0-9\-_]+$/.test(tran)) {
            const padding = tran.length % 4;
            if (padding > 0) {
                tran += Array(5 - padding).join('=');
            }

            tran = tran
                .replace(/\-/g, '+') // Convert '-' to '+'
                .replace(/\_/g, '/'); // Convert '_' to '/

            return crypto.base64decode(tran) + '';
        } else if (/^[A-Za-z0-9\+\\\=]+$/.test(tran)) {
            return crypto.base64decode(tran) + '';
        }
        return tran;
    }

    private saveTransactionInStorage(transaction: Transaction) {
        let tran: Transaction[] = this.getTransactionsFromStorage();

        tran.push(transaction);
        this.storage.setSync({
            key: this.config.getConf('storageTransactionsKey'),
            value: JSON.stringify(tran)
        });
    }

    private _decrypt(password: string) {
        const data = JSON.parse(this.storage.getSync({
            key: this.config.getConf('storageKey')
        }));
        const key = crypto.deriveSecureKey(password, 32, data.salt, 10, 4000000);
        const plaint = crypto.decryptAES256GCM(
            key.key,
            data.cipherb,
            crypto.base64encode(this.config.getConf('storageKey')),
            data.iv,
            data.atag);
        const mnemonic = crypto.base64decode(plaint) + '';
        this.wallet = ethers.Wallet.fromMnemonic(mnemonic, defaultPath);

    }

    private _encrypt(password: string) {

        const salt = crypto.base64encode(crypto.secureRandomBytes(32));
        const key = crypto.deriveSecureKey(password, 32, salt, 10, 4000000);
        const plaint = crypto.base64encode(this.wallet.mnemonic);
        const iv = crypto.base64encode(crypto.secureRandomBytes(16));
        const enc = crypto.encryptAES256GCM(
            key.key,
            plaint,
            crypto.base64encode(this.config.getConf('storageKey')),
            iv
        );
        this.storage.setSync({
            key: this.config.getConf('storageKey'),
            value: JSON.stringify({
                cipherb: enc.cipherb,
                atag: enc.atag,
                iv: iv,
                salt: salt
            })
        });
    }

    private _unicodeStringToTypedArray(s: string) {
        let arrayBuffer = new ArrayBuffer(s.length * 1);
        let newUint = new Uint8Array(arrayBuffer);
        newUint.forEach((_, i) => {
            newUint[i] = s.charCodeAt(i);
        });
        return newUint;
    }

}
