export interface GeoLocationResponse {
  formattedAddress: string;
  latitude: number;
  longitude: number;
  extra: {
    googlePlaceId: string;
    confidence: number;
    premise: null | string;
    subpremise: null | string;
    neighborhood: string;
    establishment: null | string;
  };
  administrativeLevels: {
    level2long: string;
    level2short: string;
    level1long: string;
    level1short: string;
  };
  streetNumber: string;
  streetName: string;
  city: string;
  country: string;
  countryCode: string;
  zipcode: string;
  provider: string;
}

export interface FoodTruckLocation {
  locationid: string;
  Applicant: string;
  FacilityType: string;
  cnn: string;
  LocationDescription: string;
  Address: string;
  blocklot: string;
  block: string;
  lot: string;
  permit: string;
  Status: string;
  FoodItems: string;
  X: string;
  Y: string;
  Latitude: string;
  Longitude: string;
  Schedule: string;
  dayshours: string;
  NOISent: string;
  Approved: string;
  Received: string;
  PriorPermit: string;
  ExpirationDate: string;
  Location: string;
  "Fire Prevention Districts": string;
  "Police Districts": string;
  "Supervisor Districts": string;
  "Zip Codes": string;
  "Neighborhoods (old)": string;
}
