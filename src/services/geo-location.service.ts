import NodeGeocoder from "node-geocoder";
import * as geolib from "geolib";
import { GeolibInputCoordinates } from "geolib/es/types";
import { GoogleOptions } from "node-geocoder";
import {
  FoodTruckLocation,
  GeoLocationResponse,
} from "../interfaces/geolocation.interface";

export class GeoLocationService {
  private geocoder: any;

  constructor() {
    const options: GoogleOptions = {
      provider: "google",
      apiKey: process.env.GOOGLE_API_KEY,
    };
    // const options: OpenStreetMapOptions = {
    //     provider: 'openstreetmap',
    // };
    this.geocoder = NodeGeocoder(options);
  }

  async geocode(address: string): Promise<any[]> {
    try {
      return await this.geocoder.geocode(address);
    } catch (error: any) {
      throw new Error(error);
    }
  }

  mergeGeoResultsWithCsv(csvData, geoLocatedResults, defaultRadius) {
    return csvData.filter((csvRow) => {
      return geoLocatedResults.some((geoResult) => {
        const { latitude, longitude } = geoResult;
        return this.isLocationWithinRadius(
          csvRow,
          latitude,
          longitude,
          defaultRadius
        );
      });
    });
  }

  isLocationWithinRadius(
    row: any,
    point: GeolibInputCoordinates,
    center: GeolibInputCoordinates,
    radiusMeters: number
  ): boolean {
    return geolib.isPointWithinRadius(point, center, radiusMeters);
  }

  precisionDistance(
    start: GeolibInputCoordinates,
    end: GeolibInputCoordinates,
    accuracy = 1
  ): number {
    const distance = geolib.getPreciseDistance(start, end, accuracy);
    return geolib.convertDistance(distance, "mi");
  }

  async locationsFromAddressCenter(
    geoLocatedResults: GeoLocationResponse[],
    data: any[],
    defaultRadius: number
  ): Promise<FoodTruckLocation[]> {
    const { latitude, longitude } = geoLocatedResults[0];
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const centerCoordinates: GeolibInputCoordinates = geolib.getCenter([
      { latitude, longitude },
    ]);

    return data.filter((csvRow) => {
      const rowLatitude = parseFloat(csvRow.Latitude);
      const rowLongitude = parseFloat(csvRow.Longitude);

      const distance = geolib.getDistance(
        { latitude: rowLatitude, longitude: rowLongitude },
        centerCoordinates
      );
      return distance <= defaultRadius;
    });
  }

  async geoLocatedFromAddressCenter(
    geoLocatedResults: GeoLocationResponse[],
    filteredLocations: FoodTruckLocation[],
    data: any[],
    radius: number
  ) {
    if (geoLocatedResults.length > 0 && filteredLocations.length === 0) {
      filteredLocations = [
        ...filteredLocations,
        ...(await this.locationsFromAddressCenter(
          geoLocatedResults,
          data,
          radius
        )),
      ];
    }
    return filteredLocations;
  }
}
