import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController } from '@ionic/angular';
import { Observable, Subscription } from 'rxjs';
import { Place } from '../../place.model';
import { PlacesService } from '../../places.service';

@Component({
  selector: 'app-offer-bookings',
  templateUrl: './offer-bookings.page.html',
  styleUrls: ['./offer-bookings.page.scss'],
})
export class OfferBookingsPage implements OnInit, OnDestroy {
  place: Place;
  placeId: string;

  private getPlaceSub: Subscription;

  constructor(private navCtrl: NavController, private route: ActivatedRoute, private placeService: PlacesService) {}
  ngOnDestroy(): void {
    if (this.getPlaceSub) {
      this.getPlaceSub.unsubscribe();
    }
  }

  navigateback() {
    this.navCtrl.navigateBack('/places/tabs/offers');
  }

  ngOnInit() {
    this.route.paramMap.subscribe((paramMap) => {
      if (!paramMap.has('placeId')) {
        this.navCtrl.navigateBack('/places/tabs/offers');
      }
      this.placeId = paramMap.get('placeId');
      this.getPlaceSub = this.placeService.getPlace(paramMap.get('placeId')).subscribe((place) => {
        this.place = place;
      });
    });
  }
}
