
//// REQUIRE
const _chance = require('chance'),
    chance = new _chance();

module.exports = class Map {
    constructor(options = {}){
        this.map = [];
        this.bases = [];
        this.towers = [];
        this.lanes = [];
        this.creeps = [];
        this.config = {
            width:options.width || 100,
            height:options.height || 100,
            bases:options.bases || 1000,
            base_radius:5,
            max_lane_dist: 20,
            max_neighbors: 3,
            procgen: {
                lane_dist_mean: 15,
                lane_dist_dev: 0,
                lane_turn_mean: 5,
                lane_turn_dev: 5,
                towers_per_lane_mean: 8,
                towers_per_lane_dev: 2,
            },
            ascii: {
                empty: ' ',
                tower: 'T',
                base:  'B',
                lane:  '+',
                creep: 'o'
            },
        }
    }
    
    //// UTIL
    // TODO move me to util.js
    distance(a, b){
        return Math.sqrt(Math.pow(a.x-b.x, 2)+Math.pow(a.y-b.y, 2));
    }

    samePos(a, b){
        return a.x === b.x && a.y === b.y;
    }

    getAdjacent(a){
        return [
            {x: a.x+1, y:a.y},
            {x: a.x-1, y:a.y},
            {x: a.x, y:a.y+1},
            {x: a.x, y:a.y-1},
        ];
    }

    init(){
        console.log("Initializing empty map");
        this.map = [];
        for(let x = 0; x < this.config.width; x++){
            this.map[x] = [];
            for(let y = 0; y < this.config.height; y++)
                this.map[x][y] = this.config.ascii.empty;
        }
    }

    gen(){
        console.log("Generating map");
        this.init();

        // Place one random base
        let base = {
            x: chance.integer({min: 0, max:this.config.width - 1}),
            y: chance.integer({min: 0, max:this.config.height - 1}),
            id: 0,
            neighbors: [],
        };
        this.map[base.x][base.y] = this.config.ascii.base;
        this.bases.push(base);
        
        let success = 0,
            fail = 0;
        while(this.bases.length < this.config.bases){
            if(this.addBase()) success++;
            else fail++;
            if(fail >= this.config.width * this.config.height * 2) break; // Maxed out available area
        }

        console.log(`Generated ${this.bases.length} bases (${fail} retries)`);
    }

    addBase(){
        let origin = chance.pickone(this.bases),
            cur = {x: origin.x, y: origin.y},
            cur_dir = chance.character({pool: "nsew"}),
            decided_length = Math.floor(chance.normal({mean:this.config.procgen.lane_dist_mean, dev:this.config.procgen.lane_dist_dev})),
            lane = [];
    
        // console.log(decided_length);
    
        // console.log(`Picked origin base ${origin}`);
    
        while(lane.length < decided_length){
            // Turn
            if(chance.bool({likelihood: 100 / this.config.procgen.lane_turn_mean}))
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
            if(cur.x < 0 || cur.y < 0 || cur.x >= this.config.width || cur.y >= this.config.height) return false;
    
            // Self
            for(let i = 0; i < lane.length; i++)
                if(this.samePos(lane[i], cur)) return false;
            
            // this.map
            if(this.map[cur.x][cur.y] !== this.config.ascii.empty) return false;
    
            // Take the step
            lane.push(cur);
            cur = {x: cur.x, y: cur.y};
        }
        
        // Base proximity
        for(let i = 0; i < this.bases.length; i++)
            if(this.distance(cur, this.bases[i]) < this.config.base_radius * 2) return false;
    
        // Plant lane
        lane.forEach(tile => this.map[tile.x][tile.y] = this.config.ascii.lane);
    
        // Plant base
        let base = {
            x: cur.x,
            y: cur.y,
            id: this.bases.length,
            neighbors: [origin.id]
        };
        origin.neighbors.push(base.id);
        this.bases.push(base);
        this.map[base.x][base.y] = this.config.ascii.base;
    
        // Plant towers?
        let potential_towers = [];
        for(let i = 0; i < lane.length - 1; i++){
            let tile = lane[i];
            //if(distance(tile, origin) > this.config.base_radius) break;
            let adjacent = this.getAdjacent(tile)
                    .filter(adj => adj.x >= 0 && adj.y >= 0 && adj.x < this.config.width && adj.y < this.config.height)
                    .filter(adj => this.map[adj.x][adj.y] === this.config.ascii.empty)
                    .filter(adj => !potential_towers.includes(adj));
            // } catch (e) {
            //     console.error(`Error occurred while checking for towerslot at x=${tile.x}, y=${tile.y}`);
            //     console.error(e.stack);
            // }
            Array.prototype.push.apply(potential_towers, adjacent);
            // console.log(`${potential_towers.length} potetinal towers`);
        }
    
        if(potential_towers.length > 0)
            chance.pickset(potential_towers, chance.normal({mean:this.config.procgen.towers_per_lane_mean, dev:this.config.procgen.towers_per_lane_dev}))
                .forEach(towerslot => {
                    let owner = null;
                    if(this.distance(towerslot, origin) <= this.config.base_radius)
                        owner = origin;
                    else if (this.distance(towerslot, base) <= this.config.base_radius)
                        owner = base;
                    else
                        return;
    
                    let tower = {
                        x: towerslot.x,
                        y: towerslot.y,
                        id: this.towers.length,
                    };
                    this.towers.push(tower);
                    this.map[tower.x][tower.y] = this.config.ascii.tower;
                });
    
        return base;
    }

    toString(){
        let output = "";
        for(let x = 0; x < this.config.width; x++){
            for(let y = 0; y < this.config.height; y++)
                output += this.map[x][y]
            output += '\n';
        }
        return output;
    }
}
//// RUN
// genthis.map();
// console.log(this.mapToString());