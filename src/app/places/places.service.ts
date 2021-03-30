import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, Subscription } from 'rxjs';
import { delay, filter, map, switchMap, take, tap } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { PlaceLocation } from './location.model';
import { Place } from './place.model';

interface PlaceData {
  dateFrom: string;
  dateTo: string;
  description: string;
  imageUrl: string;
  price: number;
  title: string;
  placeLocation: PlaceLocation;
  userId: string;
}

@Injectable({
  providedIn: 'root',
})
export class PlacesService {
  private _places = new BehaviorSubject<Place[]>([]);

  get places(): Observable<Place[]> {
    return this._places.asObservable();
  }

  constructor(private authService: AuthService, private http: HttpClient) {}

  getPlaces(): Observable<Place[]> {
    return this.places;
  }

  getPlace(id: string): Observable<Place> {
    return this.authService.token.pipe(
      switchMap((token) => {
        return this.http.get<PlaceData>(
          `https://ionic-angular-course-a33fa-default-rtdb.firebaseio.com/offered-places/${id}.json?auth=${token}`
        );
      }),
      map((place) => {
        const { dateFrom, dateTo, description, imageUrl, price, title, userId, placeLocation } = place;
        return new Place(
          id,
          title,
          description,
          imageUrl,
          price,
          userId,
          placeLocation,
          new Date(dateFrom),
          new Date(dateTo)
        );
      })
    );
  }

  fetchPlaces() {
    return this.authService.token.pipe(
      switchMap((token) => {
        return this.http.get<{ [key: string]: PlaceData }>(
          `https://ionic-angular-course-a33fa-default-rtdb.firebaseio.com/offered-places.json?auth=${token}`
        );
      }),
      map((res) => {
        const places = [];
        for (const key in res) {
          if (res.hasOwnProperty(key)) {
            const { userId, title, price, imageUrl, description, dateTo, dateFrom, placeLocation } = res[key];
            places.push(
              new Place(
                key,
                title,
                description,
                imageUrl,
                price,
                userId,
                placeLocation,
                new Date(dateFrom),
                new Date(dateTo)
              )
            );
          }
        }
        return places;
      }),
      tap((places) => this._places.next(places))
    );
  }

  editPlace(
    id: string,
    title: string,
    imageUrl: string,
    description: string,
    price: number,
    userId: string,
    placeLocation: PlaceLocation,
    dateFrom: Date,
    dateTo: Date
  ) {
    let updatedPlaces: Place[];
    return this.places.pipe(
      take(1),
      switchMap((places) => {
        if (!places || places.length <= 0) {
          return this.fetchPlaces();
        } else {
          return of(places);
        }
      }),
      switchMap((places) => {
        const updatedPlaceIndex = places.findIndex((pl) => pl.id === id);
        updatedPlaces = [...places];
        updatedPlaces[updatedPlaceIndex] = new Place(
          id,
          title,
          description,
          imageUrl,
          price,
          userId,
          placeLocation,
          dateFrom,
          dateTo
        );
        return this.http.put(
          `https://ionic-angular-course-a33fa-default-rtdb.firebaseio.com/offered-places/${id}.json`,
          {
            ...updatedPlaces[updatedPlaceIndex],
            id: null,
          }
        );
      }),

      tap((_) => this._places.next(updatedPlaces))
    );
  }

  addPlace(title: string, description: string, price: number, location: PlaceLocation, dateFrom: Date, dateTo: Date) {
    let genericId: string;
    let newPlace: Place;
    return this.authService.userId.pipe(
      take(1),
      switchMap((id) => {
        if (!id) throw new Error('No user Found');
        newPlace = new Place(
          Math.random().toString(),
          title,
          description,
          location.staticMapImageUrl,
          price,
          id,
          location,
          dateFrom,
          dateTo
        );
        return this.http.post<{ name: string }>(
          `https://ionic-angular-course-a33fa-default-rtdb.firebaseio.com/offered-places.json?auth=`,
          {
            ...newPlace,
            id: null,
          }
        );
      }),
      switchMap((response) => {
        genericId = response.name;
        return this.places;
      }),
      take(1),
      tap((places) => {
        newPlace.id = genericId;
        this._places.next(places.concat(newPlace));
      })
    );
  }
}
