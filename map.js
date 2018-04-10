(function(){
    //// REQUIRE
    if(typeof module !== "undefined") {
        chance = new require('chance')();
    }

    class Creep {
        constructor(options){
            this.id = options.id;
            this.base = options.base;
            this.lane = options.lane;
            this.lane_index = options.lane_index;
            this.direction = options.direction;
            this.x = options.x;
            this.y = options.y;
        }
    }

    class Lane {
        constructor(options){
            this.id = options.id;
            this.from = options.from;
            this.to = options.to;
            this.tiles = [];
        }
    }

    class Base {
        constructor(options){
            this.x = options.x;
            this.y = options.y;
            this.id = options.id;
            this.neighbors = [];
            this.lanes = [];
            this.spawn_time = 0;
        }
    }

    class Map {
        constructor(options = {}){
            this.map = [];
            this.bases = [];
            this.towers = [];
            this.lanes = [];
            this.creeps = [];
            this.last_update = Date.now();
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
                spawn_time_base: 5,
                tick_rate: 1000,
            }
        }
        
        //// UTIL
        static distance(a, b){
            return Math.sqrt(Math.pow(a.x-b.x, 2)+Math.pow(a.y-b.y, 2));
        }

        static samePos(a, b){
            return a.x === b.x && a.y === b.y;
        }

        static getAdjacent(a){
            return [
                {x: a.x+1, y:a.y},
                {x: a.x-1, y:a.y},
                {x: a.x, y:a.y+1},
                {x: a.x, y:a.y-1},
            ];
        }


        //// Methods
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
            let base = new Base({
                x: chance.integer({min: 0, max:this.config.width - 1}),
                y: chance.integer({min: 0, max:this.config.height - 1}),
                id: this.bases.length,
            });
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
                    if(Map.samePos(lane[i], cur)) return false;
                
                // this.map
                if(this.map[cur.x][cur.y] !== this.config.ascii.empty) return false;
        
                // Take the step
                lane.push(cur);
                cur = {x: cur.x, y: cur.y};
            }
            
            // Base proximity
            for(let i = 0; i < this.bases.length; i++)
                if(Map.distance(cur, this.bases[i]) < this.config.base_radius * 2) return false;
        
            // Plant lane
            let laneObj = new Lane({id: this.lanes.length});
            laneObj.tiles = lane;
            this.lanes.push(laneObj);
            lane.forEach(tile => this.map[tile.x][tile.y] = this.config.ascii.lane);
        
            // Plant base
            let base = new Base({
                x: cur.x,
                y: cur.y,
                id: this.bases.length,
            });
            base.neighbors.push(origin.id);
            origin.neighbors.push(base.id);
            this.bases.push(base);
            this.map[base.x][base.y] = this.config.ascii.base;

            // Lane attachment
            origin.lanes.push(laneObj.id);
            base.lanes.push(laneObj.id);
            laneObj.from = origin.id;
            laneObj.to = base.id;
        
            // Plant towers?
            let potential_towers = [];
            for(let i = 0; i < lane.length - 1; i++){
                let tile = lane[i];
                //if(distance(tile, origin) > this.config.base_radius) break;
                let adjacent = Map.getAdjacent(tile)
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
                        if(Map.distance(towerslot, origin) <= this.config.base_radius)
                            owner = origin;
                        else if (Map.distance(towerslot, base) <= this.config.base_radius)
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
                for(let y = 0; y < this.config.height; y++){
                    // let creepFound = false;
                    // output += creepFound ? this.config.ascii.creep : this.map[x][y];
                    output += this.map[x][y];
                }
                output += '\n';
            }
            return output;
        }

        //// Game engine
        update(){
            // console.log("Map.update()");
            //this.towers.forEach(this.updateTower);
            this.bases.forEach(this.updateBase, this);
            this.creeps.forEach(this.updateCreep, this);

            this.last_update = Date.now();
            // console.log(this.getCreepTile(this.creeps[0]).x);
        }

        updateBase(base){
            // console.log(`Updating base ${base.spawn_time}`);
            base.spawn_time--;
            if(base.spawn_time <= 0){
                base.lanes.forEach(laneId => {
                    let lane = this.lanes[laneId];
                    let creep = new Creep({
                        base: base.id,
                        lane:lane.id,
                        id: this.creeps.length,
                        direction: base.id === lane.from ? 1 : -1,
                        lane_index: base.id === lane.from ? 0 : lane.tiles.length - 1,
                    });
                    this.creeps.push(creep);
                    //console.log(`Spawning a creep at x=${this.lanes[creep.lane].tiles[creep.lane_index].x}`);
                });
                base.spawn_time = this.config.spawn_time_base;
                return;
            }
        }

        getCreepTile(creep){
        return this.lanes[creep.lane].tiles[creep.lane_index];
        }

        getCreepNextTile(creep){
            // TODO handle end
            return this.lanes[creep.lane].tiles[creep.lane_index + creep.direction];
        }

        updateCreep(creep){
            // console.log("UPDATE CREEP");
            // Move
            creep.lane_index += creep.direction;
            // if((creep.direction === -1 && creep.lane_index >= this.lanes[creep.lane].tiles.length)
            //     || (creep.direction === 1 && creep.lane_index < 0)){
            //     console.log(`Creep hit base`);
            //     this.creeps.splice(this.creeps.indexOf(creep), 1);
            // } 
            if(creep.lane_index < 0 || creep.lane_index >= this.lanes[creep.lane].tiles.length){
                console.log(`Creep out of bounds`);
                this.creeps.splice(this.creeps.indexOf(creep), 1);
            }
        }
    }

    // Node
    if(typeof module !== "undefined")
        module.exports = Map;

    // Browser
    if (typeof window === "object")
        window.Map = Map;
})();