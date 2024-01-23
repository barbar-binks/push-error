import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { StorageService } from './services/storage.service';
import { Device, DeviceId } from '@capacitor/device';
import { PermissionStatus, PushNotifications, Token } from '@capacitor/push-notifications';
import { NavController, ToastController } from '@ionic/angular';
import { SoundService } from './services/sound.service';
import { UserService } from './services/user.service';
import { register } from 'swiper/element/bundle';


register();

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {

  _langs = ["es", "en"];

  constructor(
    private translate: TranslateService,
    private storage:StorageService,
    private toastCtrl:ToastController,
    private navCtrl:NavController,
    private sound:SoundService,
    private userService:UserService,
  ) {
    const _self = this;
    PushNotifications.addListener('registration',
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
  PushNotifications.addListener('registrationError',
    (error:any) => {
      console.log('PUSH NOTIFICATION ERROR', error.error);
    }
  );
    PushNotifications.addListener('pushNotificationReceived', notification => {
      if(notification.link) {
        _self.toastCtrl.create({
          header: notification.title,
          message: notification.body,
          color: 'sky',
          swipeGesture: 'vertical',
          position: 'top',
          duration: 5000,
          buttons: [
            {
              icon: 'open',
              side: 'end',
              handler: () => {
                _self.navCtrl.navigateForward(notification.link!);
              }
            }
          ]
        }).then(
          (toast) => {
            toast.present();
            _self.sound.play('assets/sounds/notification.mp3');
          }
        )
      } else {
        _self.toastCtrl.create({
          header: notification.title,
          message: notification.body,
          color: 'sky',
          swipeGesture: 'vertical',
          position: 'top',
          duration: 5000,
        }).then(
          (toast) => {
            toast.present();
            _self.sound.play('assets/sounds/notification.mp3');
          }
        )
      }
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      const data = notification.notification.data;
      if(data.url) {
        _self.navCtrl.navigateRoot(`${data.url}`);
      }
    });
    _self.initializeApp();
  }


  initializeApp() {
    Device.getLanguageCode().then(
      (deviceLanguage) => {
        this.storage.get('DEFAULT_LANGUAGE').then(
          (defaultLanguage) => {
            if(defaultLanguage && defaultLanguage.length > 0 && this._langs.find(supportedLanguage => supportedLanguage === defaultLanguage)) {
              this.translate.setDefaultLang(defaultLanguage);
            } else if(deviceLanguage && deviceLanguage.value.length > 0 && this._langs.find(supportedLanguage => supportedLanguage === deviceLanguage.value)) {
              this.translate.setDefaultLang(deviceLanguage.value);
            } else {
              this.translate.setDefaultLang('es');
            }
          }
        )
      }
    )
  }

  
  async listenNotifications() {

  }
}
