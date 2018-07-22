import { Injectable } from '@angular/core';
import { BarcodeScanner, ScanOptions, ScanResult } from 'nativescript-barcodescanner';

@Injectable()
export class QRService {

    constructor(private barcodeScanner: BarcodeScanner) { }

    requestCameraPermission(): Promise<boolean> {
        return new Promise(resolve => {
            this.barcodeScanner.available().then((available) => {
                if (available) {
                    this.barcodeScanner.hasCameraPermission().then((granted) => {
                        if (!granted) {
                            this.barcodeScanner.requestCameraPermission().catch(err => {
                                return false;
                            }).then(per => {
                                resolve(per);
                            });
                        } else {
                            resolve(true);
                        }
                    });
                } else {
                    resolve(false);
                }
            });
        });
    }

    scan(options: ScanOptions): Promise<ScanResult> {

        options.openSettingsIfPermissionWasPreviouslyDenied = true;
        return this.barcodeScanner.scan(options).catch(err => {
            console.log(err);
            return null;
        });
        // return this.requestCameraPermission().then(p => {
        //     if(p) {
        //         return this.barcodeScanner.scan(options);
        //     }
        //     return new Promise<ScanResult>(resolve => {
        //         resolve(null)
        //     });
        // });

    }
}

