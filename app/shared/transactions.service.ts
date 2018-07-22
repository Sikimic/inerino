import { Injectable, Optional, SkipSelf, NgZone } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
require('nativescript-nodeify');
import * as ethers from 'ethers';
import * as moment from 'moment';
import * as _ from 'lodash';
import { ConfigService } from './config.service';
import { SettingsService } from './settings.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';
import { DBTransction, Transaction, TransactionViewModel } from './transaction.model';
import { Subject } from 'rxjs/Subject';
import { ToastService, ToastMsg } from './toast.service';
import { TranslateService } from '@ngx-translate/core';
import { AddressService } from './address.service';
import { DBService } from './db.service';
import { Erc20Service } from './erc20.service';


const DEFAULT_FILTER: any = {
    status: {
        pending: true, completed: true, failed: true
    },
    direction: {
        sent: true,
        received: true
    },
    tokens: ['all']
};

@Injectable()
export class TransactionsService {
    private transactionsSubject: Subject<any> = new Subject<any>();
    transactionState = this.transactionsSubject.asObservable();

    private filterSubject: Subject<any> = new Subject<any>();
    filterState = this.filterSubject.asObservable();

    balanceSubject: Subject<any> = new Subject<any>();
    balanceState = this.balanceSubject.asObservable();

    private provider: any;

    private _lastBlock: number | string = -1;

    private iface: any;
    private transferInfo: any;
    private checkInterval: any;

    filter: any;
    private initalLoad: boolean = false;
    constructor(@Optional() @SkipSelf() prior: TransactionsService,
        private httpClient: HttpClient,
        private addressService: AddressService,
        private dbService: DBService,
        private erc20Service: Erc20Service,
        private toastService: ToastService,
        private translateService: TranslateService,
        private config: ConfigService,
        private settingsService: SettingsService, private _ngZone: NgZone) {
        if (prior) {
            return prior;
        }


        this.iface = new ethers.Interface(this.config.getConf('token.abi'));
        this.transferInfo = this.iface.functions.transfer('0x0000000000000000000000000000000000000000', 0);

        this.filter = JSON.parse(JSON.stringify(DEFAULT_FILTER));

    }

    init() {
        this._lastBlock = -1;
        this.dbService.init();
        this.provider = new ethers.providers.JsonRpcProvider(this.config.getConf('jsonrpc'), this.ethersNetwork);
        // this.provider = new ethers.providers.InfuraProvider(this.ethersNetwork, this.config.getConf('infuraApiKey'));
        this.initalLoad = true;
        this.erc20Service.initErc20DB();
        this.erc20Service.setProvider(this.provider);

        this.loadFromChain();
        this.startLoop();
        this.dbService.DB.createView(`tran_1`, '1', (doc, emitter) => {
            if (doc.type === 'tran_1') {
                emitter.emit(doc.timeStamp, doc);
            }
        });

        this.dbService.DB.createView(`tran_3`, '1', (doc, emitter) => {
            if (doc.type === 'tran_3') {
                emitter.emit(doc.timeStamp, doc);
            }
        });
    }

    onNetworkChanged() {
        this._lastBlock = -1;
        this.provider = new ethers.providers.JsonRpcProvider(this.config.getConf('jsonrpc'), this.ethersNetwork);
        this.initalLoad = true;
        // this.provider = new ethers.providers.InfuraProvider(this.ethersNetwork, this.config.getConf('infuraApiKey'));
        this.erc20Service.initErc20DB();
        this.erc20Service.setProvider(this.provider);
        this.loadFromChain();
        this.startLoop();
        this.balanceSubject.next(1);
    }

    private startLoop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        this._ngZone.runOutsideAngular(() => {
            this.checkInterval = setInterval(() => {
                this.initalLoad = false;
                this.loadFromChain();
            }, 60000);
        });
    }

    private get ethersNetwork() {

        switch (this.settingsService.networkid) {
            default:
            case 3: return ethers.providers.networks.ropsten;
            case 1: return ethers.providers.networks.mainnet;
        }
    }

    hasFilter(): boolean {
        return !_.isEqual(this.filter, DEFAULT_FILTER);
    }

    applyFilter(filter: any) {
        this.filter = Object.assign({}, this.filter, filter);
        this.filterSubject.next(this.filter);
    }

    resteFilter() {
        this.filter = JSON.parse(JSON.stringify(DEFAULT_FILTER));
        this.filterSubject.next(this.filter);
    }

    get lastBlock(): string | number {
        if (this._lastBlock === -1) {
            const doc = this.dbService.DB.getDocument('lastblock_' + this.settingsService.networkid);
            if (doc) {
                this._lastBlock = doc.block;
            } else {
                this._lastBlock = 0;
            }
        }
        return this._lastBlock;
    }

    setLastBlock(b: string | number): void {
        this._lastBlock = b;
        const doc = this.dbService.DB.getDocument('lastblock_' + this.settingsService.networkid);
        if (doc === null) {
            this.dbService.DB.createDocument({
                type: 'settings',
                block: b
            }, 'lastblock_' + this.settingsService.networkid);
        } else {
            doc.block = b;
            this.dbService.DB.updateDocument('lastblock_' + this.settingsService.networkid, doc);
        }
    }

    private loadFromChain() {

        this.provider.getBlockNumber().then(block => {
            if (this.lastBlock < block) {

                Observable.forkJoin(this.loadTransactionsFromChain(block), this.loadERC20TransfersFromChain(block)).subscribe(([transactions, transfers]) => {
                    let count = 0;
                    if (transactions && transactions.status === '1' && transactions.result && transactions.result.length > 0) {
                        count += transactions.result.length;
                        transactions.result.forEach(tx => {
                            this.createOrUpdateTx(tx);
                        });
                    }

                    if (transfers && transfers.status === '1' && transfers.result && transfers.result.length > 0) {
                        count += transfers.result.length;
                        transfers.result.forEach(tx => {
                            this.createOrUpdateTx(tx);
                        });
                    }
                    this._ngZone.run(() => {
                        this.setLastBlock(block);
                        this.transactionsSubject.next(count);
                    });
                });
            }
        });
    }

    getTransactions(): Observable<Array<TransactionViewModel>> {
        let tran = this.getDBTransactions();

        if (this.hasFilter()) {
            tran = tran.filter(t => {
                if (!_.isEqual(this.filter.status, DEFAULT_FILTER.status)) {
                    if (
                        !((this.filter.status.pending && t.status === -1) ||
                            (this.filter.status.completed && t.status === 1) ||
                            (this.filter.status.failed && t.status === 0))
                    ) {
                        return false;
                    }
                }

                if (!_.isEqual(this.filter.direction, DEFAULT_FILTER.direction)) {
                    if (
                        !((this.filter.direction.sent && t.from === this.addressService.address.toLowerCase()) ||
                            (this.filter.direction.received && t.to === this.addressService.address.toLowerCase()))
                    ) {
                        return false;
                    }
                }

                if (this.filter.tokens && this.filter.tokens.length > 0) {
                    if (this.filter.tokens[0] !== 'all') {
                        if (_.indexOf(this.filter.tokens, t.token.toUpperCase()) === -1) {
                            return false;
                        }
                    }
                }
                return true;
            });
        }


        const tokenIds = tran.filter(t => {
            return t.tokenAddress && t.tokenAddress.length === 42;
        }).map(t => {
            return t.tokenAddress;
        }).filter((t, ind, arr) => arr.indexOf(t) === ind);

        return Observable.fromPromise(this.erc20Service.getRatesByTokens(tokenIds).then(rates => {
            return tran.map(t => {
                const address = t.tokenAddress || '0x';
                let rate = (rates[address] || { decimals: 18, rate: 0 });
                if (rate.rate === 0 && address === this.config.getConf('token.address')) {
                    rate.rate = rates['0x'].rate / this.config.getConf('PMAETHRate');
                }
                const price = this.erc20Service.formatUnits(t.value, rate.decimals);
                return <TransactionViewModel>{
                    hash: t.hash,
                    date: new Date(Number.parseInt(t.timeStamp) * 1000),
                    price: price,
                    symbol: t.token.toUpperCase(),
                    isIncome: t.to.toLowerCase() === this.addressService.address.toLowerCase(),
                    statusTxt: this.statusTxt(t.status),
                    to: t.to,
                    from: t.from,
                    status: t.status,
                    name: t.name,
                    description: t.description,
                    gasfee: ethers.utils.formatEther(ethers.utils.bigNumberify(t.gasPrice).mul(ethers.utils.bigNumberify(t.gasUsed))),
                    rate: rate.rate,
                    expanded: false
                };
            });
        }));
    }

    private statusTxt(status: number): string {
        let sts = 'transaction.inprogress';
        if (status !== -1) {
            sts = status === 1 ? 'transaction.completed' : 'transaction.failed';
        }

        return this.translateService.instant(sts);
    }

    getDBTransactions(): Array<DBTransction> {
        return <Array<DBTransction>>this.dbService.DB.executeQuery(`tran_${this.settingsService.networkid}`, { descending: true });
    }

    getTokensFromDBTransactions() {
        const trs = this.getDBTransactions();
        let tokens = [];
        let used: any = {};
        for (let i = 0; i < trs.length; i++) {
            const tr = trs[i];
            if (used[tr.tokenAddress]) {
                continue;
            }
            used[tr.tokenAddress] = true;
            tokens.push({ symbol: tr.token.toUpperCase(), address: tr.tokenAddress });
        }
        return tokens;
    }


    private createOrUpdateTx(tx) {
        const doc = this.dbService.DB.getDocument(tx.hash);
        const tran = this.constructDBTransaction(tx);
        if (tran !== null) {
            if (doc === null) {

                this.dbService.DB.createDocument(tran, tx.hash);
                if (!this.initalLoad && this.addressService.address.toLocaleLowerCase() === tran.to.toLocaleLowerCase()) {
                    this.sendReceivedTransactionToast();
                }
            } else {
                this.dbService.DB.updateDocument(tx.hash, tran);
            }
        }
        return tran;
    }

    createTransaction(tran: Transaction) {
        const tx = {
            hash: tran.chainTransaction.hash,
            timeStamp: moment(tran.date).unix().toString(), blockNumber: '',
            from: this.addressService.address,
            to: tran.to, value: tran.value, gasPrice: tran.chainTransaction.gasPrice,
            gasUsed: tran.chainTransaction.gasUsed, txreceipt_status: tran.chainTransaction.status,
            input: tran.data, callback: tran.callback,
            name: tran.isValid ? tran.name : '',
            description: tran.isValid ? tran.description : '', tokenSymbol: tran.token.symbol, contractAddress: tran.token.address
        };

        const res = this.createOrUpdateTx(tx);
        this.transactionsSubject.next(1);
        return res;
    }
    updateTransaction(tx: DBTransction) {
        this.dbService.DB.updateDocument(tx.hash, tx);
        this.transactionsSubject.next(1);
    }

    private sendReceivedTransactionToast() {
        this._ngZone.run(() => {
            this.translateService.get(['transactionpreview.received']).subscribe(t => {
                this.toastService.activate(<ToastMsg>{
                    message: t['transactionpreview.received'],
                    color: '#2CC93C',
                    icon: null,
                    timeout: 5000,
                    clbk: null
                });
            });
            this.balanceSubject.next(1);
        });
    }
    private isTxNoInput(tx): boolean {
        let res: boolean = (!tx.input || tx.input === '0x');
        if (!res) {
            const parsed = Number.parseInt(tx.input);
            res = (parsed === NaN || parsed === 0);
        }
        return res;
    }
    private constructDBTransaction(tx: any): DBTransction {
        tx.name = tx.name || '';
        tx.description = tx.description || '';
        tx.callback = tx.callback || '';
        tx.txreceipt_status = (typeof (tx.txreceipt_status) === 'undefined') ? 1 : tx.txreceipt_status;
        if (this.isTxNoInput(tx)) {
            return <DBTransction>{
                type: `tran_${this.settingsService.networkid}`,
                hash: tx.hash,
                blockNumber: tx.blockNumber, timeStamp: tx.timeStamp,
                from: tx.from, to: tx.to, value: tx.value, gasPrice: tx.gasPrice, gasUsed: tx.gasUsed,
                token: 'eth', name: tx.name, description: tx.description, status: Number.parseInt(tx.txreceipt_status),
                tokenAddress: '', callback: tx.callback
            };
        } else if (tx.tokenSymbol) {
            let token = this.erc20Service.getTokenByAddress(tx.contractAddress.toLowerCase());
            if (token && (token.selected || this.settingsService.receiveTokensAuto)) {
                if (!token.selected) {
                    this.erc20Service.addToken(tx.contractAddress.toLowerCase());
                }
                return <DBTransction>{
                    type: `tran_${this.settingsService.networkid}`,
                    hash: tx.hash,
                    blockNumber: tx.blockNumber, timeStamp: tx.timeStamp,
                    from: tx.from, to: tx.to, value: tx.value, gasPrice: tx.gasPrice, gasUsed: tx.gasUsed,
                    token: token.symbol.toLowerCase(), name: '', description: '',
                    status: Number.parseInt(tx.txreceipt_status),
                    tokenAddress: tx.contractAddress, callback: tx.callback
                };
            }
            return null;
        } else if (tx.input.indexOf(this.transferInfo.sighash) !== -1) {

            let token = this.erc20Service.getTokenByAddress(tx.contractAddress.toLowerCase());
            if (token && (token.selected || this.settingsService.receiveTokensAuto)) {
                if (!token.selected) {
                    this.erc20Service.addToken(tx.contractAddress.toLowerCase());
                }
                const data = ethers.Interface.decodeParams(['address', 'uint256'], '0x' + tx.input.replace(this.transferInfo.sighash, ''));
                tx.to = data[0];
                tx.value = data[1].toString();
                tx.tokenSymbol = token.symbol.toLowerCase();


                return <DBTransction>{
                    type: `tran_${this.settingsService.networkid}`,
                    hash: tx.hash,
                    blockNumber: tx.blockNumber, timeStamp: tx.timeStamp,
                    from: tx.from, to: tx.to, value: tx.value, gasPrice: tx.gasPrice, gasUsed: tx.gasUsed,
                    token: tx.tokenSymbol, name: '', description: '', status: Number.parseInt(tx.txreceipt_status),
                    tokenAddress: tx.contractAddress, callback: tx.callback
                };
            }
            return null;
        }

        return null;
    }

    getTx(hash: string): DBTransction {
        return <DBTransction>this.dbService.DB.getDocument(hash);
    }

    private loadTransactionsFromChain(endblock: string | number): Observable<any> {
        let params = new HttpParams();
        params = params.append('module', 'account');
        params = params.append('action', 'txlist');
        params = params.append('address', this.addressService.address);
        params = params.append('startblock', this.lastBlock.toString());
        params = params.append('endblock', endblock.toString());
        params = params.append('apikey', this.config.getConf('etherscan.apikey', 'C3T9A3UXIQFQMQSIW8R2TIEFF3DJFBBEGS'));
        return this.httpClient.get(this.config.getConf('etherscan.url', 'https://api-ropsten.etherscan.io/api'), { params: params });
    }

    private loadERC20TransfersFromChain(endblock: string | number): Observable<any> {
        let params = new HttpParams();
        params = params.append('module', 'account');
        params = params.append('action', 'tokentx');
        params = params.append('address', this.addressService.address);
        params = params.append('startblock', this.lastBlock.toString());
        params = params.append('endblock', endblock.toString());
        params = params.append('apikey', this.config.getConf('etherscan.apikey', 'C3T9A3UXIQFQMQSIW8R2TIEFF3DJFBBEGS'));
        return this.httpClient.get(this.config.getConf('etherscan.url', 'https://api-ropsten.etherscan.io/api'), { params: params });
    }

    getBlock(block: string | number) {
        return Observable.fromPromise(this.provider.send('eth_getBlockByNumber', [block, true]));
    }

}
