const chance = new require('chance')();

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

let map = [],
    bases = [],
    towers = []
    lanes = []
    creeps = [];

function getMap(){
    console.log("Generating map");
	map = [];
	for(let x = 0; x < config.width; x++){
		map[x] = [];
		for(let y = 0; y < config.height; y++)
			map[x][y] = config.ascii.empty;
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

function genBases(){
    console.log("Generating bases");
    let chance_config = {min: 0, max:config.width - 1};
    for(let i = 0; i < config.bases; i++){
        let x = chance.integer(chance_config),
            y = chance.integer(chance_config);

        map[x][y] = config.ascii.base;
        bases.push({
            x: x,
            y: y,
            id: bases.length,
            neighbors: []
        });
    } 
}

function distance(a, b){
    return Math.sqrt(Math.pow(a.x-b.x, 2)+Math.pow(a.y-b.y, 2));
}

function genLanes(){
    console.log("Generating lanes");
    bases.forEach(base => {
        // Get neighboring bases
        let neighbors = [];
        bases.forEach(base2 => {
            if(base === base2) return;
            if(distance(base, base2) > config.max_lane_dist) return;
            if(base2.neighbors.includes(base.id) || base.neighbors.includes(base2.id)) return;
            neighbors.push(base2);
        });
        if(neighbors.length <= 0) return; // TODO handle if base has 0 neighbors

        neighbors.forEach(neighbor => {
            if(neighbor.neighbors.length >= config.max_neighbors) return;
            if(base.neighbors.length >= config.max_neighbors) return;
            if(! chance.bool({likelihood: 100 / (Math.max(neighbor.neighbors.length, base.neighbors.length) + 1)})) return;
            console.log(`Adding lane from ${base.id} to ${neighbor.id}`);
            base.neighbors.push(neighbor.id);
            neighbor.neighbors.push(base.id);
            buildLane(base, neighbor);
        });
    });
}

function samePos(a, b){
    return a.x === b.x && a.y === b.y;
}

function buildLane(a, b){
    let lane = [],
        cur = {x:a.x, y:a.y};

    while(!samePos(cur, b)){
        // take a step (NSEW)
        let delta_x = b.x - cur.x,
            delta_y = b.y - cur.y;
        if(Math.abs(delta_x) > Math.abs(delta_y))
            cur.x += Math.sign(delta_x);
            // cur = {x: cur.x + Math.sign(delta_x), y:cur.y};
        else
            cur.y += Math.sign(delta_y);
            // cur = {x: cur.x, y:cur.y + Math.sign(delta_y)};

        // Place a tile
        if(samePos(cur, b)) return true; // reach end
        if(map[cur.x][cur.y] !== config.ascii.empty){ // collision
            console.log(`LANE COLLISION`);
            return;
        }
        //lane.push(cur);
        map[cur.x][cur.y] = config.ascii.lane;
    }
}

getMap();
genBases();
console.log(mapToString());
genLanes()
console.log(mapToString());