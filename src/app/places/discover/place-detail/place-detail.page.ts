import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ActionSheetController,
  AlertController,
  LoadingController,
  ModalController,
  NavController,
} from '@ionic/angular';
import { Subscription } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/auth.service';
import { BookingService } from 'src/app/bookings/booking.service';
import { CreateBookingComponent } from 'src/app/bookings/create-booking/create-booking.component';
import { MapModalComponent } from 'src/app/shared/map-modal/map-modal.component';
import { Place } from '../../place.model';
import { PlacesService } from '../../places.service';

@Component({
  selector: 'app-place-detail',
  templateUrl: './place-detail.page.html',
  styleUrls: ['./place-detail.page.scss'],
})
export class PlaceDetailPage implements OnInit, OnDestroy {
  place: Place;
  getPlaceSub: Subscription;
  isLoading = false;
  isBookable = false;

  constructor(
    private router: Router,
    private navCtrl: NavController,
    private route: ActivatedRoute,
    private placesService: PlacesService,
    private modalController: ModalController,
    private actionSheetController: ActionSheetController,
    private loadingController: LoadingController,
    private bookingService: BookingService,
    private authService: AuthService,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(
      (paramMap) => {
        if (!paramMap.has('placeId')) {
          this.navCtrl.navigateBack('/places/tabs/offers');
          return null;
        }
        this.isLoading = true;
        let fetchedUserId: string;
        this.authService.userId
          .pipe(
            take(1),
            switchMap((id) => {
              if (!id) throw new Error('Found no user');
              fetchedUserId = id;
              return this.placesService.getPlace(paramMap.get('placeId'));
            })
          )
          .subscribe((place) => {
            this.place = place;
            this.isBookable = place.userId !== fetchedUserId;
            this.isLoading = false;
          });
      },
      () => {
        this.alertController
          .create({
            header: 'An error ocurred!',
            message: 'Could not load place.',
            buttons: [
              {
                text: 'Okay',
                handler: () => {
                  this.router.navigate(['/places/tabs/discover']);
                },
              },
            ],
          })
          .then((alertEl) => alertEl.present());
      }
    );
  }
  ngOnDestroy() {
    if (this.getPlaceSub) {
      this.getPlaceSub.unsubscribe();
    }
  }

  onShowMap() {
    this.modalController
      .create({
        component: MapModalComponent,
        componentProps: {
          center: [this.place.placeLocation.lng, this.place.placeLocation.lat],
          selectable: false,
          closeButtonText: 'Close',
          title: this.place.placeLocation.address,
        },
      })
      .then((modalEl) => {
        modalEl.present();
      });
  }

  openBookingModal(mode: 'select' | 'random') {
    this.modalController
      .create({
        component: CreateBookingComponent,
        componentProps: { selectedPlace: this.place, selectedMode: mode },
      })
      .then((modalEl) => {
        modalEl.present();
        return modalEl.onDidDismiss();
      })
      .then((resultData) => {
        const { firstName, lastName, guestNumber, dateFrom, dateTo } = resultData.data;
        const { id, title, imageUrl } = this.place;
        if (resultData.role === 'confirm') {
          this.loadingController.create({ message: 'Saving your booking' }).then((loadingEl) => {
            loadingEl.present();
            this.bookingService
              .saveBooking(id, title, imageUrl, firstName, lastName, guestNumber, dateFrom, dateTo)
              .subscribe(() => {
                loadingEl.dismiss();
                this.router.navigate(['/', 'bookings']);
              });
          });
        }
      });
  }

  onBookPlace() {
    this.actionSheetController
      .create({
        header: 'Choose an action',
        buttons: [
          {
            text: 'Select Date',
            handler: () => this.openBookingModal('select'),
          },
          {
            text: 'Random Date',
            handler: () => this.openBookingModal('random'),
          },
          { text: 'Cancel', role: 'cancel' },
        ],
      })
      .then((actionSheetEl) => actionSheetEl.present());
  }
}
