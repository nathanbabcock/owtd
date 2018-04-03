//// REQUIRE
const chance = new require('chance')();

//// CONFIG
const config = {
	width:100,
	height:100,
    bases:50,
    max_lane_dist: 20,
    max_neighbors: 3,
	ascii: {
		empty: ' ',
		tower: 'T',
		base:  'B',
		lane:  '+',
		creep: 'o'
	}
}

//// STATE
let map = [],
    bases = [],
    towers = []
    lanes = []
    creeps = [];

//// UTIL
function distance(a, b){
    return Math.sqrt(Math.pow(a.x-b.x, 2)+Math.pow(a.y-b.y, 2));
}


function samePos(a, b){
    return a.x === b.x && a.y === b.y;
}
    
//// METHODS
function initMap(){
    console.log("Initializing empty map");
	map = [];
	for(let x = 0; x < config.width; x++){
		map[x] = [];
		for(let y = 0; y < config.height; y++)
			map[x][y] = config.ascii.empty;
    }
}

// Generate map with a random walk
function genMap(){
    console.log("Generating map");
    initMap();

    // Place one random base
    let base = {
        x: chance.integer({min: 0, max:config.width - 1}),
        y: chance.integer({min: 0, max:config.height - 1}),
        id: 0
    };
    map[base.x][base.y] = config.ascii.base;
    bases.push(base);
}

function mapToString(){
	let output = "";
	for(let x = 0; x < config.width; x++){
		for(let y = 0; y < config.height; y++)
			output += map[x][y]
		output += '\n';
	}
	return output;
}




//// RUN
genMap();
console.log(mapToString());