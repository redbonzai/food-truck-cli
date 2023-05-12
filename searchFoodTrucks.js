const fs = require('fs');
const csv = require('csv-parser');
const geolib = require('geolib');
const nodeGeoCoder = require('node-geocoder');

const options = {
    provider: 'openstreetmap',
    //  provider: 'google',
     apiKey: '',
    formatter: null
}

const defaultRadius = 100; // 1/16 mile in meters

async function geoLocation(query) {
    const geocoder = nodeGeoCoder(options);
    return await geocoder.geocode(query);
}

function filterByTruckName(query, locationData) {
    const applicant = query.toLowerCase().trim();

    return locationData.filter(row => Object.values(row)
        .some(val => typeof val === 'string' && val.toLowerCase().includes(applicant))
    );
}

function precisionDistance(start, end, accuracy = 5) {
    const distance = geolib.getPreciseDistance(start, end, accuracy);
    // The distance will be in meters, you can convert it to miles if needed
    return geolib.convertDistance(distance, 'mi');
}

function isLocationWithinRadius(row, lat, lon, radiusMeters) {
   return geolib.isPointWithinRadius(
        {latitude: parseFloat(row.Latitude), longitude: parseFloat(row.Longitude)},
        {latitude: lat, longitude: lon},
        radiusMeters // 1/16 mile
    );
}

function buildFinalResult(filteredData, locationsResult) {
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
            ? geolib.getPreciseDistance(
            { latitude: Latitude, longitude: Longitude },
            {
                latitude: locationsResult.latitude,
                longitude: locationsResult.longitude
            }
        ) / 1609.34
            : '';

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
            distance: locationsResult ? Number(distanceInMiles.toFixed(2)) + ` miles from ${Address}` : null
        };
    });
}


async function searchFoodTrucks(query, callback) {
    let  data = [];
    let filteredLocations = [];

    fs.createReadStream('mobile_food_facility_permit.csv')
        .pipe(csv())
        .on('data', row => {
            data.push(row);
        })
        .on('end', async () => {
            if (/[a-zA-Z]/.test(query)) {
                filteredLocations = filterByTruckName(query, data);
            }

            const resultLocations = await geoLocation(query);
            if (resultLocations.length > 0) {
                const lat = resultLocations[0].latitude;
                const lon = resultLocations[0].longitude;

                filteredLocations = [...filteredLocations, ...data.filter(row => isLocationWithinRadius(row, lat, lon, defaultRadius))]
            }

            const getFirstResultOrDefault = (results) =>
                results.length > 0
                    ? results[0]
                    : null;

            callback(null, buildFinalResult(filteredLocations, getFirstResultOrDefault(resultLocations)));
        });
}
exports.searchFoodTrucks = searchFoodTrucks;
