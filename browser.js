//// Require
// const
//     Map = require('./map.js'),
//     Pixi = require('pixi.js');

let map = new Map();
map.gen();
let mybase = chance.pickone(map.bases);
mybase.owner = "excalo";
map.buyUpgrade("excalo", mybase, "spawn_rate_tier", config.tiers.base.spawn_rate, 1);
// buyUpgrade(gameobject, upgrade_type);
// map.update();
// console.log(map.toString());

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

// create viewport
var viewport = new Viewport({
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    worldWidth: 1000,
    worldHeight: 1000
});
 
// add the viewport to the stage
// var app = new PIXI.Application();
// document.body.appendChild(app.view);
app.stage.addChild(viewport);
 
// activate plugins
viewport
    .drag()
    .wheel()
    .pinch()
    .decelerate();
 
// add a red box
// var sprite = viewport.addChild(new PIXI.Sprite(PIXI.Texture.WHITE));
// sprite.tint = 0xff0000;
// sprite.width = sprite.height = 100
// sprite.position.set(100, 100);

var graphics = new PIXI.Graphics();
viewport.addChild(graphics);

let renderConfig = {
    grid_size: 25,
    base_radius: 25,
    tower_radius: 15,
    creep_radius: 10,
};

function getBaseGraphics(base){
    let gfx = new PIXI.Graphics();
    gfx.beginFill(map.players[base.owner].color);
    //gfx.beginFill(base.)
    gfx.drawCircle(0, 0, renderConfig.base_radius);
    return gfx;   
}

// Bases
// graphics.beginFill(0xFF3300);
map.bases.forEach(base => {
    base.sprite = new PIXI.Sprite(getBaseGraphics(base).generateCanvasTexture());
    base.sprite.x = base.x * renderConfig.grid_size;
    base.sprite.y = base.y * renderConfig.grid_size;
    base.sprite.anchor.x = base.sprite.anchor.y = 0.5;
    viewport.addChild(base.sprite);
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


// Preload creep graphics

function getCreepOwner(creep){
    return map.bases[creep.base].owner;
}

function getCreepGraphics(creep){
    var creepGraphics = new PIXI.Graphics();
    creepGraphics.beginFill(map.players[getCreepOwner(creep)].color);
    creepGraphics.drawCircle(0, 0, renderConfig.creep_radius);
    creepGraphics.endFill();
    return creepGraphics;
}

function renderCreeps(){
    // Creeps
    map.creeps.forEach(creep => {
        // Handle deads
        // TODO death anim here?
        if(creep.dead && creep.sprite)
            creep.sprite.visible = false;
        
        else if(!creep.dead && creep.sprite && !creep.sprite.visible)
            creep.sprite.visible = true;

        if(creep.dead) return;

        // Spawn sprite for the first time
        if(!creep.sprite){


            creep.sprite = new PIXI.Sprite(getCreepGraphics(creep).generateCanvasTexture());
            creep.sprite.anchor.x = creep.sprite.anchor.y = 0.5;
            viewport.addChild(creep.sprite);
        }

        // Interpolate movement between grid squares
        let delta_time = Date.now() - map.last_update,
            tick_ratio = delta_time / config.tick_rate,
            tile = map.getCreepTile(creep),
            next_tile = map.getCreepNextTile(creep);

        if(tile === undefined || next_tile === undefined){
            creep.sprite.visible = false;
            return;
        }

        let delta_x = next_tile.x - tile.x,
            delta_y = next_tile.y - tile.y;

        // Move sprite
        creep.sprite.x = (tile.x + delta_x * tick_ratio) * renderConfig.grid_size;
        creep.sprite.y = (tile.y + delta_y * tick_ratio) * renderConfig.grid_size;
    });
}

function updateBases(){
    map.bases.forEach(base => {
        base.sprite.texture = getBaseGraphics(base).generateCanvasTexture();
    });
}

app.ticker.add(function() {
    // console.log("PIXI update");
    renderCreeps();
    updateBases();
    app.renderer.render(app.stage);
});