//// Require
const
    Map = require('./map.js'),
    Pixi = require('pixi.js');

let map = new Map();
console.log(map.config.width, map.config.height, map.config.bases);
map.gen();
console.log(map.toString());

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
};

// Bases
graphics.beginFill(0xFF3300);
// graphics.lineStyle(4, 0xffd900, 1);
map.bases.forEach(base => {
    graphics.drawCircle(base.x * renderConfig.grid_size, base.y * renderConfig.grid_size, renderConfig.base_radius);
});


// Towers

// graphics.lineStyle(4, 0xffd900, 1);
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

// myGraph.lineStyle(thickness, 0x000000)
//     .moveTo(0, 0)    
//     .lineTo(endPoint.x, endPoint.y);


// 

// // draw a shape
// graphics.moveTo(50,50);
// graphics.lineTo(250, 50);
// graphics.lineTo(100, 100);
// graphics.lineTo(50, 50);
// graphics.endFill();

// // set a fill and a line style again and draw a rectangle
// graphics.lineStyle(2, 0x0000FF, 1);
// graphics.beginFill(0xFF700B, 1);
// graphics.drawRect(50, 250, 120, 120);

// // draw a rounded rectangle
// graphics.lineStyle(2, 0xFF00FF, 1);
// graphics.beginFill(0xFF00BB, 0.25);
// graphics.drawRoundedRect(150, 450, 300, 100, 15);
// graphics.endFill();

// // draw a circle, set the lineStyle to zero so the circle doesn't have an outline
// graphics.lineStyle(0);
// graphics.beginFill(0xFFFF0B, 0.5);
// graphics.drawCircle(470, 90,60);
// graphics.endFill();

