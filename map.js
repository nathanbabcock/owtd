(function(){
    //// REQUIRE
    if(typeof module !== "undefined") {
        chance = new require('chance')();
        config = require('./config');
    }

    class Creep {
        constructor(options = {}){
            this.id = options.id;
            this.base = options.base;
            this.lane = options.lane;
            this.lane_index = options.lane_index;
            this.direction = options.direction;
            this.health = options.health;
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
            this.health = options.health;
            this.owner = options.owner;
            this.neighbors = [];
            this.lanes = [];
            this.spawn_time = 0;
            this.spawn_rate_tier = 0;
            this.creep_health_tier = 0;
        }
    }

    class Map {
        constructor(options = {}){
            this.map = [];
            this.bases = [];
            this.towers = [];
            this.lanes = [];
            this.creeps = [];
            this.players = {
                "excalo": {
                    money: 1000,
                    color: "blue",
                }
            };
            this.last_update = Date.now();
            this.player = "excalo"
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
            for(let x = 0; x < config.width; x++){
                this.map[x] = [];
                for(let y = 0; y < config.height; y++)
                    this.map[x][y] = config.ascii.empty;
            }
        }

        gen(){
            console.log("Generating map");
            this.init();

            // Place one random base
            let base = new Base({
                x: chance.integer({min: 0, max:config.width - 1}),
                y: chance.integer({min: 0, max:config.height - 1}),
                health: config.base_health,
                id: this.bases.length,
                owner: config.server_player,
            });
            this.map[base.x][base.y] = config.ascii.base;
            this.bases.push(base);
            
            let success = 0,
                fail = 0;
            while(this.bases.length < config.bases){
                if(this.addBase()) success++;
                else fail++;
                if(fail >= config.width * config.height * 2) break; // Maxed out available area
            }

            console.log(`Generated ${this.bases.length} bases (${fail} retries)`);
        }

        addBase(){
            let origin = chance.pickone(this.bases),
                cur = {x: origin.x, y: origin.y},
                cur_dir = chance.character({pool: "nsew"}),
                decided_length = Math.floor(chance.normal({mean:config.procgen.lane_dist_mean, dev:config.procgen.lane_dist_dev})),
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
                if(cur.x < 0 || cur.y < 0 || cur.x >= config.width || cur.y >= config.height) return false;
        
                // Self
                for(let i = 0; i < lane.length; i++)
                    if(Map.samePos(lane[i], cur)) return false;
                
                // this.map
                if(this.map[cur.x][cur.y] !== config.ascii.empty) return false;
        
                // Take the step
                lane.push(cur);
                cur = {x: cur.x, y: cur.y};
            }
            
            // Base proximity
            for(let i = 0; i < this.bases.length; i++)
                if(Map.distance(cur, this.bases[i]) < config.base_radius * 2) return false;
        
            // Plant lane
            let laneObj = new Lane({id: this.lanes.length});
            laneObj.tiles = lane;
            this.lanes.push(laneObj);
            lane.forEach(tile => this.map[tile.x][tile.y] = config.ascii.lane);
        
            // Plant base
            let base = new Base({
                x: cur.x,
                y: cur.y,
                health: config.base_health,
                id: this.bases.length,
                owner: config.server_player,
            });
            base.neighbors.push(origin.id);
            origin.neighbors.push(base.id);
            this.bases.push(base);
            this.map[base.x][base.y] = config.ascii.base;

            // Lane attachment
            origin.lanes.push(laneObj.id);
            base.lanes.push(laneObj.id);
            laneObj.from = origin.id;
            laneObj.to = base.id;
        
            // Plant towers?
            let potential_towers = [];
            for(let i = 0; i < lane.length - 1; i++){
                let tile = lane[i];
                //if(distance(tile, origin) > config.base_radius) break;
                let adjacent = Map.getAdjacent(tile)
                        .filter(adj => adj.x >= 0 && adj.y >= 0 && adj.x < config.width && adj.y < config.height)
                        .filter(adj => this.map[adj.x][adj.y] === config.ascii.empty)
                        .filter(adj => !potential_towers.includes(adj));
                // } catch (e) {
                //     console.error(`Error occurred while checking for towerslot at x=${tile.x}, y=${tile.y}`);
                //     console.error(e.stack);
                // }
                Array.prototype.push.apply(potential_towers, adjacent);
                // console.log(`${potential_towers.length} potetinal towers`);
            }
        
            if(potential_towers.length > 0)
                chance.pickset(potential_towers, chance.normal({mean:config.procgen.towers_per_lane_mean, dev:config.procgen.towers_per_lane_dev}))
                    .forEach(towerslot => {
                        let owner = null;
                        if(Map.distance(towerslot, origin) <= config.base_radius)
                            owner = origin;
                        else if (Map.distance(towerslot, base) <= config.base_radius)
                            owner = base;
                        else
                            return;
        
                        let tower = {
                            x: towerslot.x,
                            y: towerslot.y,
                            id: this.towers.length,
                            base: owner.id,
                            attack_cooldown: 0,
                            target: null,
                            attack_radius: config.tower_base_attack_radius,
                            damage: config.tower_base_damage,
                            damage_tier: 0,
                            radius_tier: 0,
                        };
                        this.towers.push(tower);
                        this.map[tower.x][tower.y] = config.ascii.tower;
                    });
        
            return base;
        }

        toString(){
            let output = "";
            for(let x = 0; x < config.width; x++){
                for(let y = 0; y < config.height; y++){
                    // let creepFound = false;
                    // output += creepFound ? config.ascii.creep : this.map[x][y];
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
            this.towers.forEach(this.updateTower, this);

            this.last_update = Date.now();
            // console.log(this.getCreepTile(this.creeps[0]).x);
        }

        updateBase(base){
            // console.log(`Updating base ${base.spawn_time}`);
            base.spawn_time--;
            if(base.spawn_time <= 0){
                base.lanes.forEach(laneId => {
                    let lane = this.lanes[laneId];
                    if(this.bases[lane.from].owner === this.bases[lane.to].owner) return;
                    this.spawnCreep(base, lane);
                });
                base.spawn_time = config.tiers.base.spawn_rate[base.spawn_rate_tier].value;
                return;
            }
        }

        // Utilize object pooling for creep spawning
        spawnCreep(base, lane){
            let creep = null;
            for(let i = 0; i < this.creeps.length; i++){
                if(this.creeps[i].dead){
                    creep = this.creeps[i];
                    break;
                }
            }
            if(!creep){
                creep = new Creep({id: this.creeps.length});
                this.creeps.push(creep);
            }
            creep.base = base.id;
            creep.lane = lane.id;
            creep.direction = base.id === lane.from? 1 : -1;
            creep.lane_index = base.id === lane.from? 0 : lane.tiles.length - 1;
            creep.health = config.tiers.creep.health[base.creep_health_tier];
            creep.dead = false;
        }

        getCreepTile(creep){
            return this.lanes[creep.lane].tiles[creep.lane_index];
        }

        getCreepNextTile(creep){
            // TODO handle end
            return this.lanes[creep.lane].tiles[creep.lane_index + creep.direction];
        }

        updateCreep(creep){
            if(creep.dead) return;

            // Move
            creep.lane_index += creep.direction;
            if(creep.lane_index < 0 || creep.lane_index >= this.lanes[creep.lane].tiles.length){
                console.log(`Creep hit base`);
                let baseId = creep.base === this.lanes[creep.lane].from ? this.lanes[creep.lane].to : this.lanes[creep.lane].from,
                    base = this.bases[baseId];
                base.health--;
                // Base death
                if(base.health <= 0){
                    base.health = config.base_health;
                    base.owner = this.getCreepOwner(creep);
                }
                creep.dead = true;
            }
        }

        getCreep(id){
            return this.creeps[id];
            // for(let i = 0; i < this.creeps.length; i++)
            //     if(this.creeps[i].id === id) return this.creeps[i];
        }

        updateTower(tower){
            tower.attack_cooldown--;
            let attack_radius = config.tiers.tower.radius[tower.radius_tier];

            // Check old target
            if(tower.target){
                let creep = this.getCreep(tower.target);
                if(!creep) tower.target = null;
                if(creep.dead) tower.target = null;
                else if(Map.distance(creep, tower) > attack_radius) tower.target = null;
                else if(this.getTowerOwner(tower) === this.getCreepOwner(creep)) tower.target = null;
            }

            // acquire new target
            if(!tower.target){
                let target = null,
                    target_dist = Infinity;
                this.creeps.forEach(creep => {
                    if(creep.dead) return;
                    if(this.getCreepOwner(creep) === this.getTowerOwner(tower)) return;
                    let dist = Map.distance(this.getCreepTile(creep), tower);
                    // console.log(creep, tower);
                    // console.log(dist, tower.attack_radius)
                    if(dist <= attack_radius && dist < target_dist)
                        target = creep;
                });
                if(target !== null)
                    tower.target = target.id;
            }

            // Attack target
            if(tower.target && tower.attack_cooldown <= 0){
                tower.attack_cooldown = config.tower_attack_cooldown;
                let creep = this.getCreep(tower.target);
                let tower_damage = config.tiers.tower.damage[tower.damage_tier];
                creep.health -= tower_damage;
                if(creep.health <= 0){
                    // console.log("Creep died to tower");
                    creep.dead = true;
                    tower.target = null;
                }
            }
        }
        
        // spawnPlayerBase(base, player){
        //     if(base.player !== config.server_player){
        //         console.error("Another player already owns this base!");
        //         return
        //     }
        //     base.owner = player;
        // }

        getCreepOwner(creep){ // TODO refactor these inline?
            return this.bases[creep.base].owner;
        }

        getTowerOwner(tower){
            return this.bases[tower.base].owner;
        }

        // Warning: heavy duck typing
        buyUpgrade(player, gameobject, upgrade_field, upgrade_config, tier){
            if(!this.players[player]){
                console.error(`Could not find player ${player}`);
                return false;
            }

            if(gameobject === undefined){
                console.error(`Could not find game object ${gameobject} in buyUpgrade`);
                return false;
            }

            if(gameobject[upgrade_field] === undefined){
                console.error(`Could not find upgrade field ${upgrade_field} in gameobject ${gameobject}`);
                return false;
            }

            if(upgrade_config === undefined){
                console.error(`Could not find upgrade config ${upgrade_config}`);
                return false;
            }

            if(tier === undefined){
                console.error(`No tier specified for upgrade`);
                return false;
            }

            if(tier <= gameobject[upgrade_field]){
                console.error(`Requested tier ${tier} is less than or equal to current upgrade tier for upgrade ${upgrade_field} on gameobject ${gameobject}`);
                return false;
            }

            if(tier >= gameobject[upgrade_field] + 2){
                console.error(`Requested tier ${tier} is more than one tier away from current tier ${gameobject[upgrade_field]} for upgrade ${upgrade_field} on gameobject ${gameobject}`);
                return false;
            }

            if(tier >= upgrade_config.length){
                console.error(`Requested tier ${tier} out of bounds`);
                return false;
            }

            if(gameobject.owner && gameobject.owner !== player){
                console.error('Cannot buy upgrade for gameobject owned by another player');
                return false;
            }

            if(gameobject.base && this.bases[base].owner !== player){
                console.error('Cannot buy upgrade for gameobject owned by another player');
                return false;
            }

            if(this.players[player].money < upgrade_config[tier].price){
                console.error(`Not enough money for upgrade purchase`);
                return false;
            }

            this.players[player].money -= upgrade_config[tier].price;
            gameobject.upgrade_field = tier;
            console.log("Upgrade purchased succesfully.");
        }
        //buyUpgrade("excalo", base, "spawn_rate_tier", config.tiers.base.spawn_rate, 2)

    }

    // Node
    if(typeof module !== "undefined")
        module.exports = Map;

    // Browser
    if (typeof window === "object")
        window.Map = Map;
})();