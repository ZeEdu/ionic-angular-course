import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { ModalController } from '@ionic/angular';
import * as mapboxgl from 'mapbox-gl';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-map-modal',
  templateUrl: './map-modal.component.html',
  styleUrls: ['./map-modal.component.scss'],
})
export class MapModalComponent implements OnDestroy {
  @ViewChild('map', { static: true }) mapElementRef: ElementRef;
  @Input() center: mapboxgl.LngLatLike = [-47.14226670895124, -23.53156814723573];
  @Input() selectable = true;
  @Input() closeButtonText = 'Cancel';
  @Input() title = 'Pick a Location';
  map: mapboxgl.Map;
  eventListenerExists: boolean;

  constructor(private modalController: ModalController) {}

  ngOnDestroy(): void {
    if (this.eventListenerExists) {
      this.map.off('click', ({ lngLat }) => {
        const selectedCoords = {
          lat: lngLat.lat,
          lng: lngLat.lng,
        };
        this.modalController.dismiss(selectedCoords, 'confirm');
      });
    }
  }

  renderMap() {
    this.map = new mapboxgl.Map({
      accessToken: environment.mapboxToken,
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11',
      zoom: 13,
      center: this.center,
    });

    if (this.selectable) {
      this.map.on('click', ({ lngLat }) => {
        const selectedCoords = {
          lat: lngLat.lat,
          lng: lngLat.lng,
        };
        this.eventListenerExists = true;
        this.modalController.dismiss(selectedCoords, 'confirm');
      });
    } else {
      const marker = new mapboxgl.Marker({
        color: '#3880ff',
        draggable: false,
      })
        .setLngLat(this.center)
        .addTo(this.map);
    }
  }

  ionViewDidEnter() {
    this.renderMap();
  }

  onCancel() {
    this.modalController.dismiss(null, 'cancel');
  }
}
