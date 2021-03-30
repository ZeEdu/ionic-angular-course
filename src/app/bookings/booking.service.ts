import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map, switchMap, take, tap } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { Place } from '../places/place.model';
import { Booking } from './booking.model';

interface BookingInterface {
  bookedFrom: string;
  bookedTo: string;
  guestNumber: number;
  firstName: string;
  lastName: string;
  placeId: string;
  placeImg: string;
  placeTitle: string;
  userId: string;
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private _bookings = new BehaviorSubject<Booking[]>([]);

  constructor(private authService: AuthService, private http: HttpClient) {}

  getBookings(): Observable<Booking[]> {
    return this._bookings.asObservable();
  }

  saveBooking(
    placeId: string,
    placeTitle: string,
    placeImage: string,
    firstName: string,
    lastName: string,
    guestNumber: number,
    dateFrom: Date,
    dateTo: Date
  ) {
    let booking: Booking;
    return this.authService.userId.pipe(
      take(1),
      switchMap((id) => {
        if (!id) throw new Error('No user ID found');
        booking = new Booking(
          Math.random().toString(),
          placeId,
          id,
          placeTitle,
          placeImage,
          firstName,
          lastName,
          guestNumber,
          dateFrom,
          dateTo
        );
        return this.http.post<{ name: string }>(
          'https://ionic-angular-course-a33fa-default-rtdb.firebaseio.com/bookings.json',
          {
            ...booking,
            id: null,
          }
        );
      }),
      switchMap((res) => {
        booking.id = res.name;
        return this.getBookings();
      }),
      take(1),
      tap((bookings) => {
        this._bookings.next(bookings.concat(booking));
      })
    );
  }

  fetchBookings() {
    return this.authService.userId.pipe(
      take(1),
      switchMap((id) => {
        if (!id) throw new Error('User not Found');
        return this.http.get<{ [key: string]: BookingInterface }>(
          `https://ionic-angular-course-a33fa-default-rtdb.firebaseio.com/bookings.json?orderBy="userId"&equalTo="${this.authService.userId}"`
        );
      }),
      map((bookingData) => {
        const bookings = [];
        for (const key in bookingData) {
          if (bookingData.hasOwnProperty(key)) {
            const keyData = bookingData[key];
            bookings.push(
              new Booking(
                key,
                keyData.placeId,
                keyData.userId,
                keyData.placeTitle,
                keyData.placeImg,
                keyData.firstName,
                keyData.lastName,
                keyData.guestNumber,
                new Date(keyData.bookedFrom),
                new Date(keyData.bookedTo)
              )
            );
          }
        }
        return bookings;
      }),
      take(1),
      tap((bookings) => {
        this._bookings.next(bookings);
      })
    );

    return this.http
      .get<{ [key: string]: BookingInterface }>(
        `https://ionic-angular-course-a33fa-default-rtdb.firebaseio.com/bookings.json?orderBy="userId"&equalTo="${this.authService.userId}"`
      )
      .pipe(
        map((bookingData) => {
          const bookings = [];
          for (const key in bookingData) {
            if (bookingData.hasOwnProperty(key)) {
              const keyData = bookingData[key];
              bookings.push(
                new Booking(
                  key,
                  keyData.placeId,
                  keyData.userId,
                  keyData.placeTitle,
                  keyData.placeImg,
                  keyData.firstName,
                  keyData.lastName,
                  keyData.guestNumber,
                  new Date(keyData.bookedFrom),
                  new Date(keyData.bookedTo)
                )
              );
            }
          }
          return bookings;
        }),
        take(1),
        tap((bookings) => {
          this._bookings.next(bookings);
        })
      );
  }

  cancelBookings(bookingId: string) {
    return this.http
      .delete(`https://ionic-angular-course-a33fa-default-rtdb.firebaseio.com/bookings/${bookingId}.json`)
      .pipe(
        switchMap(() => this.getBookings()),
        take(1),
        tap((bookings) => this._bookings.next(bookings.filter((b) => b.id !== bookingId)))
      );
  }
}
