import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { AuthResponseData } from '../Interfaces/auth-response-data';
import { PostSignUpResponse } from '../Interfaces/post-sign-up-response';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
})
export class AuthPage implements OnInit {
  isLoading = false;
  isLogin = true;
  constructor(
    private authService: AuthService,
    private router: Router,
    private loadingController: LoadingController,
    private alertController: AlertController
  ) {}

  ngOnInit() {}

  changeAuthMode(): void {
    this.isLogin = !this.isLogin;
  }

  showAlert(message: string) {
    this.alertController
      .create({
        header: 'Authentication failed',
        message,
        buttons: ['Okay'],
      })
      .then((alertEl) => alertEl.present())
      .catch((err) => {
        console.log(err);
      });
  }

  authenticate(email: string, password: string) {
    this.isLoading = true;
    this.loadingController
      .create({
        keyboardClose: true,
        message: 'Logging in...',
      })
      .then((loadingEl) => {
        loadingEl.present();
        let authObs: Observable<AuthResponseData>;
        if (this.isLogin) {
          authObs = this.authService.login(email, password);
        } else {
          authObs = this.authService.signup(email, password);
        }
        authObs.subscribe(
          () => {
            this.router.navigateByUrl('/places/tabs/discover');
            this.isLoading = false;
            loadingEl.dismiss();
          },
          (err) => {
            const code = err.error.error.message;
            let message: string;

            switch (code) {
              case 'EMAIL_EXISTS':
                message = 'The email address is already in use by another account';
                break;
              case 'EMAIL_NOT_FOUND':
                message = 'There is no user record corresponding to this identifier';
                break;
              case 'INVALID_PASSWORD':
                message = 'The password is invalid or the user does not have a password';
                break;
              default:
                message = 'Could not sign you up, please try again';
                break;
            }
            loadingEl.dismiss();
            this.showAlert(message);
          }
        );
      });
  }

  onSubmit(form: NgForm) {
    if (!form.valid) {
      return;
    }
    const { email, password } = form.value;
    this.authenticate(email, password);
    form.reset();
  }
}
