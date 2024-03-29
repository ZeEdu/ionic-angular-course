import { PlaceLocation } from './location.model';

export class Place {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public imageUrl: string,
    public price: number,
    public userId: string,
    public placeLocation: PlaceLocation,
    public dateFrom?: Date,
    public dateTo?: Date
  ) {}
}
