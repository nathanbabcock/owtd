//// REQUIRE
const chance = new require('chance')();

//// CONFIG
const config = {
	width:100,
	height:100,
    bases:75,
    base_radius:5,
    max_lane_dist: 20,
    max_neighbors: 3,
    procgen: {
        lane_dist_mean: 15,
        lane_dist_dev: 0,
        lane_turn_mean: 5,
        lane_turn_dev: 5
    },
	ascii: {
		empty: ' ',
		tower: 'T',
		base:  'B',
		lane:  '+',
		creep: 'o'
	},
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
        id: 0,
        neighbors: [],
    };
    map[base.x][base.y] = config.ascii.base;
    bases.push(base);
    
    let success = 0,
        fail = 0;
    while(bases.length < config.bases){
        if(addBase()) success++;
        else fail++;
    }

    console.log(`Generated ${bases.length} bases (${fail} retries)`);
}

function addBase(){
    let origin = chance.pickone(bases),
        cur = {x: origin.x, y: origin.y},
        cur_dir = chance.character({pool: "nsew"}),
        decided_length = Math.floor(chance.normal({mean:15, dev:3})),
        lane = [];

    // console.log(decided_length);

    // console.log(`Picked origin base ${origin}`);

    while(lane.length < decided_length){
        // Turn
        if(chance.bool({likelihood: 100 / config.procgen.lane_turn_mean}))
            cur_dir = chance.character({pool: "nsew".replace(cur_dir, "")});

        // Step
        switch(cur_dir){
            case 'n':
                cur.y++;
                break;
            case 's':
                cur.y--;
                break;
            case 'e':
                cur.x++;
                break;
            case 'w':
                cur.x--;
                break;
            default:
                console.error('wat');
        }

        // Edge
        if(cur.x <= 0 || cur.y <= 0 || cur.x >= config.width || cur.y >= config.height) return false;

        // Self
        for(let i = 0; i < lane.length; i++)
            if(samePos(lane[i], cur)) return false;
        
        // Map
        if(map[cur.x][cur.y] !== config.ascii.empty) return false;

        // Take the step
        lane.push(cur);
        cur = {x: cur.x, y: cur.y};
    }
    
    // Base proximity
    for(let i = 0; i < bases.length; i++)
        if(distance(cur, bases[i]) < config.base_radius * 2) return false;

    // Plant lane
    lane.forEach(tile => map[tile.x][tile.y] = config.ascii.lane);

    // Plant base
    let base = {
        x: cur.x,
        y: cur.y,
        id: bases.length,
        neighbors: [origin.id]
    };
    origin.neighbors.push(base.id);
    bases.push(base);
    map[base.x][base.y] = config.ascii.base;

    return base;
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