import { Injectable } from '@angular/core';
import {
  CanActivate,
  CanActivateChild,
  CanLoad,
  Route,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot
} from '@angular/router';

import { WalletService } from './wallet.service';
import { RouterExtensions } from 'nativescript-angular/router';


@Injectable()
export class AuthGuard implements CanActivate, CanActivateChild, CanLoad {
  deniedMessage = 'Unauthorized access denied';

  constructor(
    private router: RouterExtensions, private walletService: WalletService) { }

  canLoad(route: Route) {
    if (this.walletService.wallet == null) {
      if (this.walletService.isStorageExists) {
        this.router.navigate(['/login']);
      } else if (!this.walletService.isTermsApproved) {
        this.router.navigate(['/login/terms']);
      } else {
        this.router.navigate(['/login/create']);
      }
      return false;
    }
    return true;
  }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ) {
    if (this.walletService.wallet == null) {
      if (state.url.startsWith('/home/transaction;tran=')) {
        const tran = state.url.replace('/home/transaction;tran=', '');
        this.walletService.storeTempTransaction(tran);
      }
      if (this.walletService.isStorageExists) {
        this.router.navigate(['/login']);
      } else if (!this.walletService.isTermsApproved) {
        this.router.navigate(['/login/terms']);
      } else {
        this.router.navigate(['/login/create']);
      }
      return false;
    }
    return true;
  }

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ) {
    return this.canActivate(route, state);
  }
}
