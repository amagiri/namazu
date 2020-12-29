import parsedKeys from '../data/routeKeys.json';
var dayjs = require("dayjs");
var routeMap = new Map<string, string[]>();  // Stores a mapping of criteria to keywords
export var refRoute: Anchor; // Stores a baseline Route that everything else will be calculated off of


/* SETUP */
// Adds default route options to a reference array
export async function setup() {
    // Import route options JSON
    try {
        // const routeResponse = await fetch('data/routeKeys.json');
        // var parsedKeys = await routeResponse.json();
        mapRouteIdentifiers(parsedKeys);

        refRoute = new Anchor("dayBloodbrine", "2020-12-08T16:00:00.000Z"); // Sets anchor time and route with which everything will be calculated
        // Currently set to 12-08-2020 at 8AM PST
    } catch (error) {
        console.error(error);
        return;
    }
}

// Maps route criteria to keywords
function mapRouteIdentifiers(parsedRoutes: KeyList) {
    parsedRoutes.keywords.forEach((value) => {
        routeMap.set(value.name, value.routes);
    })
}


/* MAIN FUNCTION */
export default function main(refRoute: Anchor, inputKeys: string[], inputTimespan: Period) {
    const validKeys = convertKeys(inputKeys);
    adjustTimespan(refRoute, inputTimespan);    // Adjust timespan relative to the reference so that it starts and ends on a route time

    var totalRoutes = findAllRoutes(inputTimespan);
    var validRoutes = filterRoutes(totalRoutes, validKeys);

    return validRoutes;
}

function convertKeys(inputKeys: string[]) {
    var validSet = new Set<string>();
    inputKeys.forEach((key) => {
        if (routeMap.has(key)) {
            var values: string[] = routeMap.get(key);
            values.forEach((value) => {
                if (!validSet.has(value)) {
                    validSet.add(value);
                }
            })
        }
        else {
            if (!validSet.has(key)) {
                validSet.add(key);
            }
        }
    })

    const validKeys = Array.from(validSet);
    return validKeys;
}

export function isTimeValid(refRoute: Anchor, inputTime: Dayjs) {
    if (inputTime.diff(refRoute.datetime) >= 0) {
        return true;
    }
    else {
        return false;
    }
}

function adjustTimespan(refRoute: Anchor, timespan: Period) {
    // To account for currently active routes, subtract 15 minutes if possible
    const activeTime = timespan.start.subtract(15, 'minutes');

    if (isTimeValid(refRoute, activeTime)) {
        timespan.start = activeTime;
    }

    // Round start period up to the nearset hour
    timespan.start = timespan.start.millisecond(0);
    timespan.start = timespan.start.second(0);
    timespan.start = timespan.start.minute(0);   
    timespan.start = timespan.start.add(1, 'hour');  
    // If num in setHours(num) exceeds 23, the day will increment, so I will not check for overflow
    // Likewise if it is less than 0, the day will decrement

    timespan.end = timespan.end.minute(0); // Round end period down
    timespan.end = timespan.end.second(0);
    timespan.end = timespan.end.minute(0);   

    // Adjust start and end times as necessary so that they are in increments of 2 from the reference
    const startHourDiff = timespan.start.subtract(refRoute.datetime).hour();
    if ((startHourDiff % 2) != 0) {
        timespan.start = timespan.start.add(1, 'hour'); // Increment one hour if the difference is odd
    }

    const endHourDiff = timespan.start.subtract(refRoute.datetime).hour();
    if ((endHourDiff % 2) != 0) {
        timespan.end = timespan.end.subtract(1, 'hour'); // Decrement one hour if the difference is odd
    }
}

// Finds all routes
function findAllRoutes(timespan: Period): Solution[] {
    var outputRoutes: Solution[] = new Array();
    var currentTime: Dayjs = timespan.start;

    while (timespan.end.diff(currentTime) >= 0) {
        outputRoutes.push(getRoute(refRoute, currentTime));

        currentTime = currentTime.add(2, 'hour');   // Move forward two hours
    } 

    return outputRoutes;
}

function getRoute(refRoute: Anchor, inputTime: Dayjs): Solution {
    const timeElapsed: number = inputTime.diff(refRoute.datetime);
    const hourConversion = 1000 * 60 * 60;
    const totalHours = timeElapsed/hourConversion;  // This should always be a whole number due to our earlier rounding

    const daysElapsed = Math.floor(totalHours/24);
    const hoursPassed = totalHours % 24;
    const routesElapsed = hoursPassed / 2;

    // const dailySchedule = ['day','sunset', 'night']; 
    // IMPORTANT: These are set up relative to the anchor point, so this will need to be updated if the anchor point is changed
    const sailingRoutes = ['Bloodbrine', 'Rothlyt', 'Merlthor', 'Rhotano'];
    const sailingTimes = ['day', 'sunset', 'night'];

    // All runs at a given time of day are now in blocks grouped together
    // Routes run consistently within each time block in the following order: Bloodbrine -> Rothlyt -> Merlthor -> Rhotano
    // At 8AM PST, the next route the would be scheduled is removed, moving all the routes up 2 hours earlier from the previous day

    const hourlyRoute = sailingRoutes[(daysElapsed + routesElapsed) % 4];  // Each day past the anchor counts as an increment of 1 to the sailingRoutes array because of the routes shifting in time
    const hourlyTime = sailingTimes[Math.floor((daysElapsed + routesElapsed)/4) % 3]; // Each day past the anchor causes the weather to change one hour sooner

    const currentRoute = hourlyTime.concat(hourlyRoute);    // Generate the keyword for the given combination
    const jsDate: Date = inputTime.toDate();    // Convert dayjs object back to JavaScript Date object
    const displayDate: string = jsDate.toLocaleString([], { month: '2-digit', day: '2-digit', year: '2-digit', hour: '2-digit', minute:'2-digit', hour12: true, timeZoneName: 'short'});    // Convert to string

    return new Solution(currentRoute, displayDate);
}

function filterRoutes(routeList: Solution[], inputKeys: string[]) {
    var filteredRoutes: Solution[] = new Array();

    routeList.forEach((route) => {
        if (inputKeys.includes(route.key)) {
            filteredRoutes.push(route);
        }
    })

    return filteredRoutes;
}


/* CLASS DECLARATIONS */
export class Anchor {
    key: string;
    datetime: Dayjs;

    constructor(key: string, datetime: string) {
        this.key = key;
        this.datetime = dayjs(datetime);
    }
}

export class Period {
    start: Dayjs;
    end: Dayjs;

    constructor(start: Dayjs, end: Dayjs) {
        this.start = start;
        this.end = end;
    }
}

export class Solution {
    key: string;
    displayTime: string;

    constructor(key: string, displayTime: string) {
        this.key = key;
        this.displayTime = displayTime;
    }
}


/* JSON IMPORT INTERFACES */
interface KeyList {
    keywords: RouteKeyword[];
}

interface RouteKeyword {
    name: string;
    routes: string[];
}