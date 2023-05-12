#!/usr/bin/env node

const {searchFoodTrucks} = require('./searchFoodTrucks');

const query = process.argv[2];

if (!query) {
    console.error('Please provide a search query: Address, Food Truck Name, Food Item');
    process.exit(1);
}

searchFoodTrucks(query, (error, results) => {
    if (error) {
        console.error('THERE HAS BEEN AN ERROR: ', error);
        process.exit(1);
    } else {
        console.log(`Found ${results.length} food trucks within range of ${query}:`, results);
        process.exit(0);
    }
});
