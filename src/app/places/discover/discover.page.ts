import { Component, OnDestroy, OnInit } from '@angular/core';
import { Place } from '../place.model';
import { PlacesService } from '../places.service';

import { SegmentChangeEventDetail } from '@ionic/core';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-discover',
  templateUrl: './discover.page.html',
  styleUrls: ['./discover.page.scss'],
})
export class DiscoverPage implements OnInit, OnDestroy {
  private filter = 'all';
  loadedPlaces: Place[];
  placesList: Place[];
  relevantPlaces: Place[];

  private getPlacesSubs: Subscription;
  isLoading: boolean;

  constructor(private placesService: PlacesService, private authService: AuthService) {}

  ngOnInit() {
    this.getPlacesSubs = this.placesService.getPlaces().subscribe((places) => {
      this.loadedPlaces = places;
      this.onFilterUpdate(this.filter);
    });
  }

  ionViewWillEnter() {
    this.isLoading = true;
    this.placesService.fetchPlaces().subscribe(() => (this.isLoading = false));
  }

  ngOnDestroy() {
    if (this.getPlacesSubs) {
      this.getPlacesSubs.unsubscribe();
    }
  }

  onFilterUpdate(filter: string) {
    this.authService.userId.pipe(take(1)).subscribe((id) => {
      const isShown = (place: Place) => {
        return filter === 'all' || place.userId !== id;
      };
      this.relevantPlaces = this.loadedPlaces.filter(isShown);
      this.filter = filter;
    });
  }
}
