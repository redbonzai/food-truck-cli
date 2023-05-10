const fs = require('fs');
const csv = require('csv-parser');
const geolib = require('geolib');
const nodeGeoCoder = require('node-geocoder');
// {
//     provider: 'openstreetmap'
// }

// let customFetchImplementation = function(url, options) {
//     return new Promise((resolve, reject) => {
//         const request = require('request');
//         request(url, function(error, response, body) {
//             if (error) {
//                 reject(error);
//             } else {
//                 resolve({ json: () => JSON.parse(body) });
//             }
//         });
//     });
// };
const options = {
    provider: 'google',
    apiKey: 'AIzaSyBofuWHTBUs37lrtkhB9md1C5GeTluTBhU',
    formatter: null
}
const geocoder = nodeGeoCoder(options);
async function searchFoodTrucks(zipOrAddress, callback) {
    const radiusMeters = geolib.convertDistance(100, 'mi') * 1000;
    const searchLocation = await geocoder.geocode(zipOrAddress);
    console.log('SEARCH LOCATION:', searchLocation)
    if (!searchLocation || searchLocation.length === 0) {
        callback(new Error(`Could not geocode address: ${zipOrAddress}`));
        return;
    }

    const lat = searchLocation[0].latitude;
    const lon = searchLocation[0].longitude;
    const data = [];

    fs.createReadStream('mobile_food_facility_permit.csv')
        .pipe(csv())
        .on('data', row => {
            data.push(row);
        })
        .on('end', () => {

            const nearbyTrucks = data.filter(row =>
                geolib.isPointWithinRadius(
                    { latitude: parseFloat(row.Latitude), longitude: parseFloat(row.Longitude) },
                    { latitude: lat, longitude: lon },
                    radiusMeters
                )
            );

            const results = nearbyTrucks.map(row => ({
                Address: row.Address,
                blocklot: row.blocklot,
                permit: row.permit,
                Status: row.Status,
                Approved: row.Approved,
                Schedule: row.Schedule,
                FoodItems: row.FoodItems
            }));

            callback(null, results);
        });
}

// Example usage:
searchFoodTrucks('555 Mission ST', (error, results) => {
    if (error) {
        console.error('THERE HAS BEEN AN ERROR: ',error);
    } else {
        console.log(`Found ${results.length} food trucks:`);
        console.log('WE HAVE RESULTS:', results);
    }
});







