module.exports = class Base {
    constructor(options){
        this.x = options.x;
        this.y = options.y;
        this.id = options.id;
        this.neighbors = [];
        this.lanes = [];
        this.spawn_time = 0;
    }
}