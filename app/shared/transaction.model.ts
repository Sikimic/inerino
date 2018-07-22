

export interface Transaction {
    to: string;
    value: string;
    description: string;
    name: string;
    pic: string;
    data: string;
    hash: string;
    callback: string;
    date: Date;
    signature: string;
    networkid: number;
    chainTransaction: any;
    isValid: boolean;
    type: TransactionType;
    token: any;
}

export interface DBTransction {
    type: string;
    hash: string;
    blockNumber: string;
    timeStamp: string;
    from: string;
    to: string;
    value: string;
    gasPrice: string;
    gasUsed: string;
    token: string;
    tokenAddress: string;
    name: string;
    description: string;
    status: number;
    callback: string;
}

export interface TransactionViewModel {
    hash: string;
    date: Date;
    price: number;
    symbol: string;
    isIncome: boolean;
    statusTxt: string;
    statusCls: string;
    status: number;
    to: string;
    from: string;
    name: string;
    description: string;
    gasfee: number;
    expanded: boolean;
    rate: number;
}

export enum TransactionType {
    PMA = 1,
    ETH = 2,
    ERC20 = 3
}

export interface TempTransaction {
    tran: string;
    date: Date;
}

export interface Signature {
    r: Buffer;
    s: Buffer;
    v: number;
}

export enum TransactionStatus {
    Scaned = 0,
    Open = 1,
    Approved = 2,
    Declined = 3,
    Cancelled = 4
}
