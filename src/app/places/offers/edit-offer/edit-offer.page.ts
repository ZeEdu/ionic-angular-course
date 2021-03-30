import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, LoadingController, NavController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Place } from '../../place.model';
import { PlacesService } from '../../places.service';

@Component({
  selector: 'app-edit-offer',
  templateUrl: './edit-offer.page.html',
  styleUrls: ['./edit-offer.page.scss'],
})
export class EditOfferPage implements OnInit, OnDestroy {
  place: Place;
  getPlaceSub: Subscription;
  isLoading = false;

  availableFromMinDate = new Date(new Date().getFullYear(), 0, 1).toISOString();
  availableFromMaxDate = new Date(new Date().getFullYear() + 5, 0, 1).toISOString();
  availableToMinDate = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate() + 1
  ).toISOString();
  availableToMaxDate = new Date(new Date().getFullYear() + 5, 0, 1).toISOString();
  form: FormGroup;
  placeId: string;

  constructor(
    private route: ActivatedRoute,
    private placesService: PlacesService,
    private navCtrl: NavController,
    private loadingController: LoadingController,
    private router: Router,
    private alertController: AlertController
  ) {}

  ngOnDestroy(): void {
    if (this.getPlaceSub) {
      this.getPlaceSub.unsubscribe();
    }
  }

  ngOnInit() {
    this.route.paramMap.subscribe((paramMap) => {
      if (!paramMap.has('placeId')) {
        this.navCtrl.navigateBack('/places/tabs/discover');
        return null;
      }
      this.placeId = paramMap.get('placeId');
      this.isLoading = true;
      this.getPlaceSub = this.placesService.getPlace(paramMap.get('placeId')).subscribe(
        (place) => {
          this.place = place;
          this.buildForm();
          this.isLoading = false;
        },
        (error) => {
          this.alertController
            .create({
              header: 'An error ocurred!',
              message: 'Place could not be fetched. Please try again later',
              buttons: [{ text: 'Okay', handler: () => this.router.navigate(['/places/tabs/offers']) }],
            })
            .then((alertEl) => alertEl.present());
        }
      );
    });
  }

  buildForm() {
    this.form = new FormGroup({
      title: new FormControl(this.place.title, {
        updateOn: 'blur',
        validators: Validators.required,
      }),
      description: new FormControl(this.place.description, {
        updateOn: 'blur',
        validators: Validators.required,
      }),
      price: new FormControl(this.place.price, {
        updateOn: 'blur',
        validators: Validators.required,
      }),
      dateFrom: new FormControl(this.place.dateFrom ? this.place.dateFrom.toISOString() : null, {
        updateOn: 'blur',
        validators: Validators.required,
      }),
      dateTo: new FormControl(this.place.dateTo ? this.place.dateTo.toISOString() : null, {
        updateOn: 'blur',
        validators: Validators.required,
      }),
      location: new FormControl(null, {
        validators: [Validators.required],
      }),
    });
  }

  mockEdit() {}

  onSaveEdit() {
    if (!this.form.valid) {
      return null;
    }

    this.loadingController.create({ message: 'Saving your changes' }).then((loadingEl) => {
      loadingEl.present();
      this.placesService
        .editPlace(
          this.place.id,
          this.form.get('title').value,
          this.place.imageUrl,
          this.form.get('description').value,
          this.form.get('price').value,
          this.place.userId,
          this.form.get('location').value,
          this.form.get('dateFrom').value,
          this.form.get('dateTo').value
        )
        .subscribe(() => {
          loadingEl.dismiss();
          this.router.navigate(['/places/tabs/offers']);
        });
    });
  }
}
