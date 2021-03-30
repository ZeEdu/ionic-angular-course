import { Component, OnInit } from '@angular/core';
import { IonItemSliding, LoadingController } from '@ionic/angular';
import { Observable, Subscription } from 'rxjs';
import { Booking } from './booking.model';
import { BookingService } from './booking.service';

@Component({
  selector: 'app-bookings',
  templateUrl: './bookings.page.html',
  styleUrls: ['./bookings.page.scss'],
})
export class BookingsPage implements OnInit {
  loadedBookings: Observable<Booking[]>;
  isLoading = false;

  constructor(private bookingsService: BookingService, private loadingController: LoadingController) {}

  ngOnInit() {
    this.loadedBookings = this.bookingsService.getBookings();
  }

  ionViewWillEnter() {
    this.isLoading = true;
    this.bookingsService.fetchBookings().subscribe(() => (this.isLoading = false));
  }

  onCancelBooking(bookingId: string, slidingEl: IonItemSliding) {
    slidingEl.close();
    this.loadingController.create({ message: 'Canceling this booking' }).then((loadingEl) => {
      loadingEl.present();
      this.bookingsService.cancelBookings(bookingId).subscribe(() => {
        loadingEl.dismiss();
      });
    });
  }
}
