let config = {
    width: 25,
    height: 25,
    bases: 3,
    base_radius: 5,
    base_health: 5,
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
    creep_base_health: 3,
    tower_attack_cooldown: 1,
    tower_base_attack_radius: 5,
    tower_base_damage: 1,
    server_player: "server",
    creep_cash_value: 10,
    tower_price: 100,
    tiers: {
        tower: {
            damage: [
                { value: 1, price: 100 },
                { value: 2, price: 200 },
                { value: 3, price: 300 },
                { value: 4, price: 400 },
            ],
            radius: [
                { value: 5, price: 100 },
                { value: 6, price: 200 },
                { value: 7, price: 300 },
            ]
        },
        base: {
            // health: [
            //     { value: 5, price: 500 },
            //     { value: 6, price: 500 },
            //     { value: 7, price: 500 },
            //     { value: 8, price: 500 },
            //     { value: 9, price: 500 },
            //     { value: 10, price: 500 },
            // ],
            spawn_rate: [
                { value: 5, price: 100 },
                { value: 4, price: 250 },
                { value: 3, price: 500 },
                { value: 2, price: 1000 },
                { value: 1, price: 10000 },
            ],
        },
        creep: {
            health: [
                { value: 1, price: 100},
                { value: 2, price: 200},
                { value: 3, price: 300},
                { value: 4, price: 400},
                { value: 5, price: 500},
            ],
            // damage: [
            //     { value: 1, price: 100},
            //     { value: 2, price: 500},
            //     { value: 3, price: 1000},
            // ],
        }
    },
}

// Node
if(typeof module !== "undefined")
    module.exports = config;