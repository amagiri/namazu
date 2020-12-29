# namazu
 A package that outputs the time and routes for ocean fishing in Final Fantasy XIV.
 
 Last Update: 12/27/20 (Patch 5.4)

## Using namazu

### Installation
```console
npm install dayjs --save
```

### Supported Inputs
This package uses a map of keywords and routes to determine what times to output. Modifications can be made to ./data/routeKeys.json if you need to update the map. The following keys are supported:

#### Blue fish
```sothis, elasmosaurus, stonescale, coralmanta, hafgufa, seafaringtoad, placodus```

#### Achievements
```dragon, jelly, shark, octo, puffer, crab, manta, points```

#### Time of Day
```day, sunset, night```

#### Routes
```merlthor, rhotano, bloodbrine, rothlyt```

The output will be a time-of-day/route pair, eg. ```sunsetBloodbrine```.