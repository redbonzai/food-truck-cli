# FOOD TRUCK CLI

### GEO LOCATING SERVICES:

>This CLI will Perform a geospatial search: Given a zip code, use a geocoding service (such as Google Maps Geocoding API or OpenStreetMap Nominatim API) to obtain the latitude and longitude coordinates of that location. 
>This is done via the geolib NPM package to calculate the distance between each food truck and the search location. 
>This service selects only the food trucks within a 30 mile radius of the search location.
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

### HOW TO INSTALL
- Clone the repo to your local machine
- CD into the root directory of the project and install 
```terminal
    cd food-truck-cli && npm install && npm install -g
```
- Create .env file and then add your Google Geolocation API KEY to the `GOOGLE_API_KEY` key.
```terminal
cp .env.example .env
```
---
PLEASE KEEP IN MIND: On a windows machine you need to run these commands individually and as an Administrator
Also Note that on a Linux / Mac, this gets installed in `/usr/local/bin/food-truck` 
and on a Windows machine, this gets installed in `C:\Users\{username}\AppData\Roaming\npm\node_modules\food-truck-cli\bin\food-truck`

By the way, if you no longer want this installed on your machine, then please: 
```terminal
    npm uninstall -g food-truck-cli
```

### HOW TO MAKE THIS CLI WORK
### OPTIONS:
> there is currently only one option: --radius
```terminal
food-truck "1265 GROVE ST" --radius 300
```
### EXAMPLE:
>The default radius is 100 meters (about 1/16 of a mile).  If you want to change that, you have to provide the --radius option
> That option only excepts integer values.
---
If you run the cli with the zip code: 94114, there aren't any locations within 1/16 of a mile of of it. 
Therefore, if you increase the radius to 300 meters, 
you will see that there is 1 location within that radius. 
```terminal
    food-truck "94114" --radius 300
```

- Run the application by typing the following command in your terminal and give it some arguments: 
> Below are some examples of NON-ADDRESS queries:
```terminal
food-truck "Noodles"
```
```terminal
food-truck: "Natan's Catering"
```
```terminal
food-truck "Ice Cream: Waffle Cones"
```

In the above three cases:  
**_When the first parameter is a non address query:_**
the CLI filters through the data and determines whether "Noodles" is a value of any of the columns.

```terminal
food-truck "1200 MISSISSIPPI ST"
```

```terminal
food-truck "94107"
```
In the last two cases above, 
**_The first parameter is an address query (address / zip code):_**
the CLI will geo-locate the address / zip code and then filter through the data to determine which locations are within 200 meters of the geocoded address / zip code. 
>The radius can be changed dynamically by adding an optional parameter of `--radius` followed by an integer value.
EXAMPLE:
```terminal
food-truck "94107" --radius 300
``` 
---

### MORE ADVANCED WAYS TO QUERY THE CLI:
- IF the first parameter is not an address, or zip code, you can still add optional parameters
like --radius, and --address.  
So the query looks like this: 
```terminal
food-truck "Noodles" --radius 300 --address "1265 GROVE ST"
```

#### What goes on under the hood:
>The CLI will FIRST geolocate the address, and then filter through the locations in the data source who are within a 300 meter radius of the geocoded address
> that are serving Noodles.

- What if the first parameter IS an address or zip code?
```terminal
food-truck "1265 GROVE ST" --radius 400 --name "Treats by the bay"
```
>Similarly as above, the CLI will first geolocade the given address / zip code, and then filter through the locations in the data source who are within a 400 meter radius of the geocoded address
and attempt to retrieve results that have a name like "Treats by the bay".

#### FINAL NOTE
If you send non zip code / non address queries to the CLI, 
It won't be able to tell you how far away each location is from the the origin point
because you didn't send anything that could be geolocated.

Also, it is worth noting, that if send a query like: 
```terminal
food-truck "Treats by the bay" --radius 400
```
The CLI will return a statement that you should provide an --address parameter because a radius makes no sense without an address.

