import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { ActionSheetController, AlertController, ModalController } from '@ionic/angular';
import { of } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { ReverseGeocodingResponse } from 'src/app/Interfaces/reverse-geocoding-response';
import { PlaceLocation } from 'src/app/places/location.model';
import { environment } from 'src/environments/environment';
import { MapModalComponent } from '../../map-modal/map-modal.component';

@Component({
  selector: 'app-location-picker',
  templateUrl: './location-picker.component.html',
  styleUrls: ['./location-picker.component.scss'],
})
export class LocationPickerComponent implements OnInit {
  @Input() showPreview = false;
  selectedLocationImage: string;
  isLoading = false;
  @Output() locationPick = new EventEmitter<PlaceLocation>();

  constructor(
    private modalController: ModalController,
    private http: HttpClient,
    private actionSheetController: ActionSheetController,
    private alertController: AlertController
  ) {}

  ngOnInit() {}

  private createPlace(lat: number, lng: number) {
    const pickedLocation: PlaceLocation = {
      lat,
      lng,
      address: null,
      staticMapImageUrl: null,
    };
    this.isLoading = true;
    this.getAddress(lat, lng)
      .pipe(
        switchMap((address) => {
          pickedLocation.address = address;
          return of(this.getMapImage(pickedLocation.lat, pickedLocation.lng, 15));
        })
      )
      .subscribe((staticMapImageUrl) => {
        pickedLocation.staticMapImageUrl = staticMapImageUrl;
        this.selectedLocationImage = staticMapImageUrl;
        this.isLoading = false;
        this.locationPick.emit(pickedLocation);
      });
  }

  private openMap() {
    this.modalController.create({ component: MapModalComponent }).then((modalEl) => {
      modalEl.onDidDismiss().then(({ data, role }) => {
        if (data) {
          const { lat, lng } = data as { lat: number; lng: number };
          this.createPlace(lat, lng);
        } else {
          return;
        }
      });
      modalEl.present();
    });
  }

  private locateUser() {
    if (!Geolocation) {
      this.showErrorAlert('Could not fetch location', 'Please use the map to pick a location');
    }
    this.isLoading = true;
    Geolocation.getCurrentPosition()
      .then((position) => this.createPlace(position.coords.latitude, position.coords.longitude))
      .catch(() => this.showErrorAlert('Could not fetch location', 'Please use the map to pick a location'))
      .finally(() => (this.isLoading = false));
  }

  showErrorAlert(header: string, message: string) {
    this.alertController
      .create({
        header,
        message,
        buttons: ['Okay'],
      })
      .then((alertEl) => alertEl.present());
  }

  onPickLocation() {
    this.actionSheetController
      .create({
        header: 'Please choose',
        buttons: [
          {
            text: 'Auto-Locate',
            handler: () => this.locateUser(),
          },
          {
            text: 'Pick on Map',
            handler: () => this.openMap(),
          },
          {
            text: 'Cancel',
            role: 'cancel',
          },
        ],
      })
      .then((actionSheetEl) => {
        actionSheetEl.present();
      });
  }

  getMapImage(lat: number, lng: number, zoom: number) {
    return `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/geojson(%7B%22type%22%3A%22Point%22%2C%22coordinates%22%3A%5B${lng}%2C${lat}%5D%7D)/${lng},${lat},${zoom}/500x300?access_token=${environment.mapboxToken}`;
  }

  getAddress(lat: number, lng: number) {
    return this.http
      .get<ReverseGeocodingResponse>(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${environment.mapboxToken}`
      )
      .pipe(
        take(1),
        map((geoData) => {
          if (!geoData || !geoData.features || geoData.features.length === 0) {
            return null;
          }
          return geoData.features[0].place_name;
        })
      );
  }
}
