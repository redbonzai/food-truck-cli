const fs = require('fs');
const csv = require('csv-parser');
const geolib = require('geolib');
const nodeGeoCoder = require('node-geocoder');

const options = {
    provider: 'openstreetmap',
    // provider: 'google',
    // apiKey: 'YOUR_API_KEY',
    formatter: null
}
// const geocoder = nodeGeoCoder(options);
async function geoLocation(query) {
    let resultLocations;

    const geocoder = nodeGeoCoder(options);

    const radius = geolib.convertDistance(50, 'mi')*1000;
    resultLocations = await geocoder.geocode(query);
    return {resultLocations, radius};
}

function filterByTruckName(query, locationData) {
    const applicant = query.toLowerCase().trim();

    return locationData.filter(row => Object.values(row)
        .some(val => typeof val === 'string' && val.toLowerCase().includes(applicant))
    );
}

function isLocationWithinRadius(row, lat, lon, radius) {
    return geolib.isPointWithinRadius(
        {latitude: parseFloat(row.Latitude), longitude: parseFloat(row.Longitude)},
        {latitude: lat, longitude: lon},
        radius
    );
}

function buildFinalResult(filteredData) {
    return filteredData.map(row => ({
        locationId: row.locationid,
        applicant: row.Applicant,
        address: row.Address,
        locationDescription: row.LocationDescription,
        blocklot: row.blocklot,
        permit: row.permit,
        status: row.Status,
        approved: row.Approved,
        schedule: row.Schedule,
        daysHours: row.dayshours || 'Hourly schedule not posted',
        foodItems: row.FoodItems
    }));
}

async function searchFoodTrucks(query, callback) {
    let  data = [];
    let filteredData = [];

    fs.createReadStream('mobile_food_facility_permit.csv')
        .pipe(csv())
        .on('data', row => {
            data.push(row);
        })
        .on('end', async () => {
            if (/[a-zA-Z]/.test(query)) {
                filteredData = filterByTruckName(query, data);
                // console.log('By TRUCK NAME:', filteredData)
            }

            const {resultLocations, radius} = await geoLocation(query);
            if (resultLocations.length > 0) {
                const lat = resultLocations[0].latitude;
                const lon = resultLocations[0].longitude;
                filteredData = [...filteredData, ...data.filter(row => isLocationWithinRadius(row, lat, lon, radius))]
                console.log('By GEO LOCATION:', filteredData)
            }

            const results = buildFinalResult(filteredData);

            callback(null, results);
        });
}
exports.searchFoodTrucks = searchFoodTrucks;
