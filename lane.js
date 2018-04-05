module.exports = class Lane {
    constructor(options){
        this.id = options.id;
        this.from = options.from;
        this.to = options.to;
        this.tiles = [];
    }
}