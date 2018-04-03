//// REQUIRE
const chance = new require('chance')();

//// CONFIG
const config = {
	width:100,
	height:100,
    bases:50,
    max_lane_dist: 20,
    max_neighbors: 3,
    procgen: {
        lane_dist_mean: 15,
        lane_dist_dev: 10,
        lane_turn_mean: 5,
        lane_turn_dev: 5
    },
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

    let cur = {x: base.x, y: base.y},
        cur_lane_length = 0,
        cur_dir = chance.character({pool: "nsew"});
    while(bases.length < config.bases){
        // Turn
        if(chance.bool({likelihood: 100 / config.procgen.lane_turn_mean}))
            cur_dir = chance.character({pool: "nsew"});

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
        if(cur.x <= 0 || cur.y <= 0 || cur.x >= config.width || cur.y >= config.height) continue;

        // Base
        if(chance.bool({likelihood: 100 / config.procgen.lane_dist_mean})){
            map[cur.x][cur.y] = config.ascii.base;
            bases.push({
                x: cur.x,
                y: cur.y,
                id:bases.length
            });
        } else
            map[cur.x][cur.y] = config.ascii.lane;
    }
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