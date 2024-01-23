import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Device, DeviceId } from '@capacitor/device';
import { PushNotifications, Token } from '@capacitor/push-notifications';
import { AlertController, LoadingController, NavController, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'src/app/services/auth.service';
import { StorageService } from 'src/app/services/storage.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

  _deviceId: DeviceId;
  _loginForm: FormGroup = new FormGroup({
    email: new FormControl('', [
      Validators.required,
      Validators.email,
    ]),
    password: new FormControl('', [
      Validators.required
    ]),
    device_name: new FormControl('', [
      Validators.required,
    ])
  });

  _passwordType:string = "password";

  constructor(private navCtrl:NavController, private alertCtrl:AlertController, private translate:TranslateService, private authService:AuthService, private storage:StorageService, private userService:UserService, private loadingCtrl:LoadingController, private toastCtrl:ToastController) { }

  ngOnInit() {
    const _self = this;
    Device.getId().then(
      (deviceId) => {
        _self._deviceId = deviceId;
        _self._loginForm.controls['device_name'].setValue(deviceId.identifier);
      }
    )
  }

  changePasswordType() {
    const _self = this;
    if(_self._passwordType === 'password') {
      _self._passwordType = 'text';
    } else {
      _self._passwordType = 'password';
    }
  }

  submit() {
    const _self = this;
    _self.loadingCtrl.create({
      spinner: 'dots',
      message: _self.translate.instant('LOADERS.LOGGING_IN.MESSAGE'),
    }).then(
      (loader) => {
        loader.present();
        _self.authService.login(_self._loginForm.value).then(
          (success) => {
            _self.storage.set('AUTH_TOKEN', success.token).then(
              () => {
                _self.storage.set('USER_DATA', success.user_data).then(
                  async () => {
                    _self.navCtrl.navigateRoot('');
                    loader.dismiss();
                    _self.toastCtrl.create({
                      color: 'success',
                      message: _self.translate.instant('TOASTS.LOG_IN.SUCCESS'),
                      duration: 5000,
                      position: 'top',
                      swipeGesture: 'vertical'
                    }).then(
                      (toast) => {
                        toast.present();
                      }
                    )
                    await PushNotifications.addListener('registration',
                    (token: Token) => {
                      Device.getId().then(
                        (id:DeviceId) => {
                          _self.userService.registerFcm(token, id).then(
                            (result:any) => {
                              console.log(result.message);
                            },
                            (error) => {
                              console.log(error.error);
                            }
                          )
                        }
                      )
                    }
                  );
                  await PushNotifications.addListener('registrationError',
                    (error:any) => {
                      console.log('PUSH NOTIFICATION ERROR', error.error);
                    }
                  );
                    Device.getInfo().then(
                      (deviceInfo) => {
                        if(deviceInfo.platform !== "web") {
                          PushNotifications.checkPermissions().then(
                            (permissionStatus) => {
                              if(permissionStatus.receive == 'granted') {
                                PushNotifications.register();
                              }
                              else {
                                PushNotifications.requestPermissions().then(
                                  (requestResult) => {
                                    if(requestResult.receive == 'granted') {
                                      PushNotifications.register();
                                    }
                                  }
                                )
                              }
                            }
                          );
                        }
                      }
                    )
                    });
              }
            )
          },
          (error) => {
            _self.alertCtrl.create({
              header: _self.translate.instant('ALERTS.LOGIN_FAILED.HEADER'),
              subHeader: _self.translate.instant('ALERTS.LOGIN_FAILED.SUBHEADER'),
              message: (error.error.code == 401) ? _self.translate.instant('ALERTS.LOGIN_FAILED.INVALID_CREDENTIALS') : _self.translate.instant('ALERTS.LOGIN_FAILED.GENERAL_ERROR'),
              buttons: [
                {
                  text: _self.translate.instant('BUTTONS.DISMISS'),
                  role: 'dismiss',
                }
              ]
            }).then(
              (alert) => {
                loader.dismiss();
                alert.present();
              }
            )
          }
        )
      }
    )
  }

  goToForgot() {
    const _self = this;
    _self.navCtrl.navigateForward('forgot');
  }

  openInformation() {
    const _self = this;
    _self.alertCtrl.create({
      header: _self.translate.instant('ALERTS.INFORMATION.HEADER'),
      message: _self.translate.instant('ALERTS.INFORMATION.MESSAGE'),
      cssClass: 'alert-message-justified',
      buttons: [
        {
          text: _self.translate.instant('BUTTONS.DISMISS'),
          role: 'dismiss',
        }
      ]
    }).then(
      (alert) => {
        alert.present();
      }
    )
  }

}
