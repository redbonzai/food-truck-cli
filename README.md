# FOOD TRUCK CLI

### GEO LOCATING SERVICES:

This CLI will Perform a geospatial search: Given a zip code, use a geocoding service (such as Google Maps Geocoding API or OpenStreetMap Nominatim API) to obtain the latitude and longitude coordinates of that location. 
This is done via the geolib NPM package to calculate the distance between each food truck and the search location. 
This service selects only the food trucks within a 30 mile radius of the search location.
---

As mentioned above: This cli will run fine with the OpenStreetMap geo locating API.
It will also run with the Google Geo locating API, but you will need to provide your own API key.
---
##### It should be noted that the query results are much more accurate with the Google Maps Geocoding API than with the OpenStreetMap Nominatim API.

### DESCRIPTION
>This is a command line interface that allows you to search for food trucks in San Francisco that are open at the current time. 
>The program will return the following information from a valid search: 
```terminal
    locationId, 
    applicant,
    address,
    locationDescription,
    blocklot,
    permit,
    status,
    approved,
    schedule,
    daysHours,
    foodItems,
    distance
```

### VALID SEARCHES: 
- addresses
- zipcodes
- truck name ( OR Applicant name )
- food items that are served: Noodles, Donuts, Tacos
- permit status: APPROVED, REQUESTED, EXPIRED
---
> NOTE: you can search using ANY of the columns provided in the accompanying CSV file. 
> Above, are only recommendations.

### HOW TO USE
- Clone the repo to your local machine
- CD into the root directory of the project and install 
```terminal
    cd food-truck-cli && npm install && npm install -g
```
PLEASE KEEP IN MIND: On a windows machine you need to run these commands individually and as an Administrator
Also Note that on a Linux / Mac, this gets installed in `/usr/local/bin/food-truck` 
and on a Windows machine, this gets installed in `C:\Users\{username}\AppData\Roaming\npm\node_modules\food-truck-cli\bin\food-truck`

By the way, if you no longer want this installed on your machine, then please: 
```terminal
    npm uninstall -g food-truck-cli
```
- Run the application by typing the following command in your terminal and give it some arguments: 
> Below are some examples:
```terminal
food-truck "Noodles"
```

```terminal
food-truck: "Natan's Catering"
```

```terminal
food-truck "1200 MISSISSIPPI ST"
```

```terminal
food-truck "94107"
```

```terminal
food-truck "Ice Cream: Waffle Cones"
```
