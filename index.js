#!/usr/bin/env node

const yargs = require('yargs');
const {
    searchFoodTrucks,
    isZipCode,
    isAddress,
} = require('./searchFoodTrucks');

const argv = yargs
    .option('address', {
        alias: 'a',
        describe: 'Address or zip code for filtering',
        type: 'string'
    })
    .option('radius', {
        alias: 'r',
        describe: 'Radius in meters',
        type: 'number'
    })
    .option('name', {
        alias: 'n',
        describe: 'string that is contained in a column value - food truck name, food item, etc.',
        type: 'string'
    })
    .demandCommand(1, 'Please provide a search query: Address, Food Truck Name, Food Item')
    .strict()
    .check((argv) => {
        if (typeof argv.radius === 'number' || argv.radius === undefined) {
            return true;
        } else {
            throw new Error('Error: The --radius value must be a number.');
        }
    })
    .parse();

const query = argv._[0];
const radius = argv.radius;
const address = argv.address;
const name = argv.name;

if ((!isZipCode(query) && !isAddress(query)) && radius && !address) {
    console.error(`When using a non-address query like: "${query}", you must provide an address to geo-locate on as well.`);
    process.exit(1);
}
const responseMessage = (results) => {
    return isAddress(query) || isZipCode(query)
        ? `Found ${results.length} food trucks within a ${Number(radius / 1609.344).toFixed(2)} mile range of ${query} `
        : `Found ${results.length} food trucks within the search results for: ${query}`;
}

const run = async () => {
    try {
        const results = await searchFoodTrucks(query, radius, name, address);
        console.log(results);
        console.log(responseMessage(results));
        process.exit(0);
    } catch (error) {
        console.error('THERE HAS BEEN AN ERROR:', error);
        process.exit(1);
    }
}

run();
