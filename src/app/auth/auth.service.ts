import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, from } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AuthResponseData } from '../Interfaces/auth-response-data';
import { PostSignInResponse } from '../Interfaces/post-sign-in-response';
import { PostSignUpResponse } from '../Interfaces/post-sign-up-response';
import { User } from '../Models/user';

import { Storage } from '@capacitor/storage';

@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnDestroy {
  private _user = new BehaviorSubject<User>(null);
  private activeLogoutTimer: any;

  get userId() {
    return this._user.asObservable().pipe(
      map((user) => {
        if (user) return user.id;
        return null;
      })
    );
  }

  get userIsAuthenticated() {
    return this._user.asObservable().pipe(
      map((user) => {
        if (user) return !!user.token;
        else return false;
      })
    );
  }

  get token() {
    return this._user.asObservable().pipe(
      map((user) => {
        if (user) return user.token;
        else return false;
      })
    );
  }

  constructor(private http: HttpClient) {}

  ngOnDestroy(): void {
    if (this.activeLogoutTimer) clearTimeout(this.activeLogoutTimer);
  }

  signup(email: string, password: string) {
    return this.http
      .post<AuthResponseData>(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${environment.firebase}`, {
        email,
        password,
        returnSecureToken: true,
      })
      .pipe(tap(this.setUserData.bind(this)));
  }

  login(email: string, password: string) {
    return this.http
      .post<AuthResponseData>(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${environment.firebase}
		`,
        { email, password, returnSecureToken: true }
      )
      .pipe(tap(this.setUserData.bind(this)));
  }

  autoLogin() {
    return from(Storage.get({ key: 'authData' })).pipe(
      map((storeData) => {
        if (!storeData || !storeData.value) return null;
        const { email, token, userId, tokenExpirationDate } = JSON.parse(storeData.value) as {
          userId: string;
          email: string;
          token: string;
          tokenExpirationDate: string;
        };
        const expirationTime = new Date(tokenExpirationDate);
        if (expirationTime <= new Date()) return null;
        return new User(userId, email, token, new Date(tokenExpirationDate));
      }),
      tap((user) => {
        if (user) this._user.next(user);
        this.activeLogoutTimer = setTimeout(() => this.logout(), user.tokenDuration);
      }),
      map((user) => !!user)
    );
  }

  logout() {
    if (this.activeLogoutTimer) clearTimeout(this.activeLogoutTimer);
    this._user.next(null);
    Storage.remove({ key: 'authData' });
  }

  private autoLogout(duration: number) {
    if (this.activeLogoutTimer) clearTimeout(this.activeLogoutTimer);
    this.activeLogoutTimer = setTimeout(() => this.logout(), duration);
  }

  private storeAuthDate(userId: string, email: string, token: string, tokenExpirationDate: string) {
    Storage.set({ key: 'authData', value: JSON.stringify({ userId, email, token, tokenExpirationDate }) });
  }

  private setUserData(userData: AuthResponseData) {
    const { email, expiresIn, idToken, localId } = userData;
    const expirationTime = new Date(new Date().getTime() + +expiresIn * 1000);
    const user = new User(localId, email, idToken, expirationTime);
    this._user.next(user);
    this.activeLogoutTimer = setTimeout(() => this.logout(), user.tokenDuration);
    this.storeAuthDate(localId, email, idToken, expirationTime.toISOString());
  }
}
