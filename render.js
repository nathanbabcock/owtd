//// Require
const
    Map = require('./map.js'),
    Pixi = require('pixi.js');

let map = new Map();
console.log(map.config.width, map.config.height, map.config.bases);
map.gen();
// map.update();
console.log(map.toString());

let gameLoop = setInterval(map.update.bind(map), 1000);

let app = new PIXI.Application({
    antialias: true,
    autoStart: true,
    backgroundColor: 0xffffff,
    width: window.innerWidth - 25,
    height:window.innerHeight - 25,
});
window.addEventListener('resize', () => app.renderer.resize(window.innerWidth - 25, window.innerHeight - 25));
document.body.appendChild(app.view);

var graphics = new PIXI.Graphics();
app.stage.addChild(graphics);

let renderConfig = {
    grid_size: 25,
    base_radius: 25,
    tower_radius: 15,
    creep_radius: 10,
};

// Bases
graphics.beginFill(0xFF3300);
// graphics.lineStyle(4, 0xffd900, 1);
map.bases.forEach(base => {
    graphics.drawCircle(base.x * renderConfig.grid_size, base.y * renderConfig.grid_size, renderConfig.base_radius);
});


// Towers
map.towers.forEach(tower => {
    graphics.beginFill(0x0000FF);
    graphics.drawCircle(tower.x * renderConfig.grid_size, tower.y * renderConfig.grid_size, renderConfig.tower_radius);
    graphics.endFill();
});

// Lanes
graphics.lineStyle(4, 0x000000);
 map.lanes.forEach(lane => {
    graphics.moveTo(lane.from.x * renderConfig.grid_size, lane.from.y * renderConfig.grid_size);
    graphics.lineTo(lane.tiles[0].x * renderConfig.grid_size, lane.tiles[0].y * renderConfig.grid_size);
    for(let i = 0; i < lane.tiles.length - 1; i++){
        graphics.moveTo(lane.tiles[i].x  * renderConfig.grid_size, lane.tiles[i].y * renderConfig.grid_size);
        graphics.lineTo(lane.tiles[i+1].x * renderConfig.grid_size, lane.tiles[i+1].y * renderConfig.grid_size);
    }
    // graphics.moveTo(lane.tiles[lane.tiles.length - 1].x  * renderConfig.grid_size, lane.tiles[lane.tiles.length - 1].y * renderConfig.grid_size);
    graphics.lineTo(lane.to.x  * renderConfig.grid_size, lane.to.y * renderConfig.grid_size);
});

// Creeps
map.creeps.forEach(creep => {
    graphics.beginFill(0xFF00FF);
    let tile = map.getCreepTile(creep);
    let nextTile = map.getCreepNextTile(creep);
    graphics.drawCircle(tile.x * renderConfig.grid_size, tile.y * renderConfig.grid_size, renderConfig.creep_radius);
    graphics.endFill();
});