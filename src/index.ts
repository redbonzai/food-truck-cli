#!/usr/bin/env node

require("dotenv").config();
import express from "express";
import * as yargs from "yargs";
import { blue, bold, red, green } from "colorette";

import { FoodTruckService } from "./services/food-truck.service";
import { CsvParserService } from "./services/csv-parser.service";
import { GeoLocationService } from "./services/geo-location.service";

const server = express();
const port: number = parseInt(process.env.PORT || "4200");

server.listen(port, () => console.log(`Server listening on port ${port}`));

const argv = yargs
  .option("address", {
    alias: "a",
    describe: "Address or zip code for filtering",
    type: "string",
  })
  .option("radius", {
    alias: "r",
    describe: "Radius in meters",
    type: "number",
  })
  .option("name", {
    alias: "n",
    describe:
      "string that is contained in a column value - food truck name, food item, etc.",
    type: "string",
  })
  .demandCommand(
    1,
    "Please provide a search query: Address, Food Truck Name, Food Item"
  )
  .strict()
  .check((argv) => {
    if (typeof argv.radius === "number" || argv.radius === undefined) {
      return true;
    } else {
      throw new Error("Error: The --radius value must be a number.");
    }
  })
  .parse() as {
  address?: string;
  radius?: number;
  name?: string;
  _: string[];
  $0: string;
};

const query: string = argv._[0];
const radius: number | undefined = argv.radius;
const address: string = argv.address;
const name: string = argv.name;

// Instantiate the services
const csvParserService = new CsvParserService();
const geoLocationService = new GeoLocationService();
const foodTrucks = new FoodTruckService(csvParserService, geoLocationService);

if (
  !foodTrucks.isZipCode(query) &&
  !foodTrucks.isAddress(query) &&
  radius &&
  !address
) {
  console.error(
    red(
      `When using a non-address query like: "${query}", you must provide an address to geo-locate on as well.`
    )
  );
  process.exit(1);
}
const responseMessage = (results) => {
  return foodTrucks.isAddress(query) || foodTrucks.isZipCode(query)
    ? `Found ${results.length} food trucks within a ${Number(
        radius / 1609.344
      ).toFixed(2)} mile range of ${query} `
    : `Found ${results.length} food trucks within the search results for: ${query}`;
};

const run = async () => {
  try {
    const results = await foodTrucks.search(query, radius, name, address);
    console.log(results);
    console.log(bold(blue(responseMessage(results))));
    process.exit(0);
  } catch (error) {
    console.error("THERE HAS BEEN AN ERROR:", error);
    process.exit(1);
  }
};

run();
