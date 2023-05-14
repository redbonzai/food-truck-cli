const fs = require('fs');
const csv = require('csv-parser');
const geolib = require('geolib');
const nodeGeoCoder = require('node-geocoder');

const options = {
    provider: 'openstreetmap',
    // provider: 'google',
    // apiKey: '',
    formatter: null
}

const isZipCode = (query) => {
    const zipCodeRegex = /^\d{5}$/;
    return zipCodeRegex.test(query);
}

const isAddress = (query) => {
    // Regex pattern to match address format (e.g., 123 Main St, City, State)
    const addressRegex = /(\d+\s+\w+\s+\w+)|(\d+\s+\w+)/;
    return addressRegex.test(query);
}

const getFirstResultOrDefault = (results) =>
    results.length > 0 ? results[0] : null;

const csvData = (filePath) => {
    return new Promise((resolve, reject) => {
        const data = [];

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', row => data.push(row))
            .on('end', () => resolve(data))
            .on('error', error => reject(error));
    });
}

const geoLocation = async (query) => {
    const geocoder = nodeGeoCoder(options);
    return await geocoder.geocode(query);
}

const mergeGeoResultsWithCsv = (csvData, geoLocatedResults, defaultRadius) => {
    return csvData.filter((csvRow) => {
        return geoLocatedResults.some((geoResult) => {
            const {latitude, longitude} = geoResult;
            return isLocationWithinRadius(csvRow, latitude, longitude, defaultRadius);
        });
    });
}

const filterByColumnValues = async (query, csvData) => {
    console.log('query', query)
    const search = query.toLowerCase().trim();

    return await csvData.filter(row => Object.values(row)
        .some(val => typeof val === 'string' && val.toLowerCase().includes(search))
    );
}

const precisionDistance = (start, end, accuracy = 1) => {
    const distanceInMeters = geolib.getPreciseDistance(start, end, accuracy);
    return geolib.convertDistance(distanceInMeters, 'mi');
}

const isLocationWithinRadius = (locatedRow, lat, lon, radiusMeters) => {
    return geolib.isPointWithinRadius(
        {latitude: parseFloat(locatedRow.Latitude), longitude: parseFloat(locatedRow.Longitude)},
        {latitude: lat, longitude: lon},
        radiusMeters
    );
}

const locationsFromAddressCenter = (geoLocatedResults, data, defaultRadius) => {
    const {latitude, longitude} = geoLocatedResults[0];
    const centerCoordinates = geolib.getCenter([
        {latitude, longitude}
    ])

    return data.filter((csvRow) => {
        const rowLatitude = parseFloat(csvRow.Latitude);
        const rowLongitude = parseFloat(csvRow.Longitude);

        const distance = geolib.getDistance(
            {latitude: rowLatitude, longitude: rowLongitude},
            centerCoordinates
        )
        return distance <= defaultRadius;
    });
}

const buildFinalResult = (filteredData, locationsResult) => {
    return filteredData.map(row => {
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
            FoodItems
        } = row;

        const distanceInMiles = locationsResult
            ? precisionDistance(
                { latitude: Latitude, longitude: Longitude },
                { latitude: locationsResult.latitude, longitude: locationsResult.longitude }
            ) : '';

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
            daysHours: dayshours || 'Hourly schedule not posted',
            foodItems: FoodItems,
            distance: locationsResult ?  Number(distanceInMiles).toFixed(4) + ` miles from ${Address}` : null
        };
    });
}

async function searchFoodTrucks(query, radius, name, address) {
    try {
        const {geoLocatedResults , filteredLocations}
            = await compileSearch(query, radius, address, name)

        return buildFinalResult(
            filteredLocations,
            getFirstResultOrDefault(geoLocatedResults)
        );

    } catch (error) {
        console.log('There was an error searching for food trucks:', error)
        throw new Error(error)
    }
}

const compileSearch = async(query, radius, address, name) => {
    const defaultRadius = radius || 200; // 1/12 mile in meters
    let geoLocatedResults = [];
    let filteredLocations = [];
    const data = await csvData('mobile_food_facility_permit.csv');

    // case 4: non address query with optional radius, and optional address
    // geolocate the optional address then filter through csv for lat / long points within default radius distance of address
    // then look for trucks that match the non-address query
    if (!isZipCode(query) && !isAddress(query) && address !== undefined) {
        geoLocatedResults = await geoLocation(address);
        filteredLocations = await mergeGeoResultsWithCsv(data, geoLocatedResults, defaultRadius);

        filteredLocations = [...filteredLocations, ...filterByColumnValues(query, filteredLocations)];
        return {geoLocatedResults, filteredLocations}
    }

    // case 3: address query with optional radius, and optional name
    // geolocated address then filter through csv for lat / long points within radius distance of address
    // and return filtered results that match name
    if ((isZipCode(query) || isAddress(query)) && name !== undefined) {
        geoLocatedResults = await geoLocation(query);
        filteredLocations = mergeGeoResultsWithCsv(data, geoLocatedResults, defaultRadius);

        filteredLocations = [...filteredLocations, ...await filterByColumnValues(name, filteredLocations)];
        return {geoLocatedResults, filteredLocations}
    }

    // case 2: non-address query
    // filter through csv for non-address-value matches
    if (!isZipCode(query) && !isAddress(query)) {
        filteredLocations = filterByColumnValues(query, data);

        return {geoLocatedResults, filteredLocations}
    }

    // case 1: address query with optional radius
    // geolocate address then filter through csv for lat / long
    // points within default radius distance of address
    if ((isZipCode(query) || isAddress(query))) {
        geoLocatedResults = await geoLocation(query);
        filteredLocations = mergeGeoResultsWithCsv(data, geoLocatedResults, defaultRadius);

        if (geoLocatedResults.length > 0 && filteredLocations.length === 0) {
            filteredLocations = [
                ...filteredLocations,
                ...locationsFromAddressCenter(geoLocatedResults, data, defaultRadius)
            ];
        }

        return {geoLocatedResults, filteredLocations}
    }
}

module.exports = {
    isZipCode,
    isAddress,
    precisionDistance,
    searchFoodTrucks
};
