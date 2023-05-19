import { CsvParserService } from "./csv-parser.service";
import { GeoLocationService } from "./geo-location.service";
import {
  FoodTruckResponse,
  ResponseKeys,
} from "../interfaces/search.interface";
import {
  FoodTruckLocation,
  GeoLocationResponse,
} from "../interfaces/geolocation.interface";

export class FoodTruckService {
  private static csvFileName = "Mobile_Food_Facility_Permit.csv";

  constructor(
    private readonly csvParser: CsvParserService,
    private readonly geoLocation: GeoLocationService
  ) {}

  isZipCode(query: string): boolean {
    const zipCodeRegex = /^\d{5}$/;
    return zipCodeRegex.test(query);
  }

  isAddress(query): boolean {
    // Regex pattern to match address format (e.g., 123 Main St, City, State)
    const addressRegex = /(\d+\s+\w+\s+\w+)|(\d+\s+\w+)/;
    return addressRegex.test(query);
  }

  isNonAddressQueryWithAddress(query: string, address: string): boolean {
    return (
      !this.isZipCode(query) && !this.isAddress(query) && address !== undefined
    );
  }

  isAddressQueryWithName(query: string, name: string): boolean {
    return (
      (this.isAddress(query) || this.isZipCode(query)) && name !== undefined
    );
  }

  isNonAddressQuery(query: string): boolean {
    return !this.isZipCode(query) && !this.isAddress(query);
  }

  isAddressQuery(query: string): boolean {
    const response = this.isZipCode(query) || this.isAddress(query);
    console.log("RESPONSE", response);
    return response;
  }

  private geoLocationFirstOrNull(
    results: GeoLocationResponse[]
  ): GeoLocationResponse | null {
    return results.length > 0 ? results[0] : null;
  }

  private async handleNonAddressQueryWithAddress(
    query: string,
    address: string,
    data: any[],
    radius: number
  ): Promise<{
    geoLocatedResults: GeoLocationResponse[];
    filteredLocations: FoodTruckLocation[];
  }> {
    const geoLocatedResults: GeoLocationResponse[] =
      await this.geoLocation.geocode(address);
    let filteredLocations: FoodTruckLocation[] =
      await this.csvParser.filterByColumnValues(query, data);
    filteredLocations = [
      ...filteredLocations,
      ...(await this.geoLocation.locationsFromAddressCenter(
        geoLocatedResults,
        data,
        radius
      )),
    ];

    return { geoLocatedResults, filteredLocations };
  }

  private async handleAddressQueryWithName(
    query: string,
    name: string,
    data: any[],
    radius: number
  ): Promise<{
    geoLocatedResults: GeoLocationResponse[];
    filteredLocations: FoodTruckLocation[];
  }> {
    const geoLocatedResults: GeoLocationResponse[] =
      await this.geoLocation.geocode(query);

    const filteredLocations: FoodTruckLocation[] = [
      ...(await this.csvParser.filterByColumnValues(name, data)),
      ...(await this.geoLocation.mergeGeoResultsWithCsv(
        data,
        geoLocatedResults,
        radius
      )),
    ];

    return { geoLocatedResults, filteredLocations };
  }

  private async handleNonAddressQuery(
    query: string,
    data: any[]
  ): Promise<{
    geoLocatedResults: GeoLocationResponse[];
    filteredLocations: FoodTruckLocation[];
  }> {
    const geoLocatedResults: GeoLocationResponse[] = [];
    const filteredLocations = await this.csvParser.filterByColumnValues(
      query,
      data
    );

    return { geoLocatedResults, filteredLocations };
  }

  private async handleAddressQuery(
    query: string,
    data: any[],
    radius: number
  ): Promise<{
    geoLocatedResults: GeoLocationResponse[];
    filteredLocations: FoodTruckLocation[];
  }> {
    const geoLocatedResults: GeoLocationResponse[] =
      await this.geoLocation.geocode(query);
    const filteredLocations: FoodTruckLocation[] =
      await this.geoLocation.locationsFromAddressCenter(
        geoLocatedResults,
        data,
        radius
      );

    return { geoLocatedResults, filteredLocations };
  }

  async compileSearch(
    query: string,
    radius?: number,
    name?: string,
    address?: string
  ): Promise<{
    geoLocatedResults: GeoLocationResponse[];
    filteredLocations: FoodTruckLocation[];
  }> {
    const defaultRadius = radius || 200; // 1/12 mile in meters
    const data = await this.csvParser.parseCsv(FoodTruckService.csvFileName);

    if (this.isNonAddressQueryWithAddress(query, address)) {
      return await this.handleNonAddressQueryWithAddress(
        query,
        address,
        data,
        defaultRadius
      );
    }

    if (this.isAddressQueryWithName(query, name)) {
      return await this.handleAddressQueryWithName(
        query,
        name,
        data,
        defaultRadius
      );
    }

    if (this.isNonAddressQuery(query)) {
      return await this.handleNonAddressQuery(query, data);
    }

    if (this.isAddressQuery(query)) {
      return await this.handleAddressQuery(query, data, defaultRadius);
    }
  }

  private buildFinalResult(
    filteredData: FoodTruckLocation[],
    geoLocationResult: GeoLocationResponse
  ): FoodTruckResponse[] {
    return filteredData.map((row: ResponseKeys) => {
      const {
        Latitude,
        Longitude,
        locationid,
        Applicant,
        Address,
        LocationDescription,
        blocklot,
        permit,
        Status,
        Approved,
        Schedule,
        dayshours,
        FoodItems,
      } = row;

      const distanceInMiles = geoLocationResult
        ? this.geoLocation.precisionDistance(
            { latitude: Latitude, longitude: Longitude },
            {
              latitude: geoLocationResult.latitude,
              longitude: geoLocationResult.longitude,
            }
          )
        : "";

      return {
        locationId: locationid,
        applicant: Applicant,
        address: Address,
        locationDescription: LocationDescription,
        blocklot,
        permit,
        status: Status,
        approved: Approved,
        schedule: Schedule,
        daysHours: dayshours || "Hourly schedule not posted",
        foodItems: FoodItems,
        distance: geoLocationResult
          ? Number(distanceInMiles).toFixed(4) + ` miles from ${Address}`
          : null,
      };
    });
  }

  async search(
    query: string,
    radius?: number,
    name?: string,
    address?: string
  ): Promise<FoodTruckResponse[]> {
    const { geoLocatedResults, filteredLocations } = await this.compileSearch(
      query,
      radius,
      name,
      address
    );

    return this.buildFinalResult(
      filteredLocations,
      this.geoLocationFirstOrNull(geoLocatedResults)
    );
  }
}
