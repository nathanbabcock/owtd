module.exports = class Creep {
    constructor(options){
        this.id = options.id;
        this.base = options.base;
        this.lane = options.lane;
        this.lane_index = options.lane_index;
        this.direction = options.direction;
    }
}