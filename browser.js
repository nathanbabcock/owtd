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


// Preload creep graphics
var creepGraphics = new PIXI.Graphics();
creepGraphics.beginFill(0xFF00FF);
creepGraphics.drawCircle(0, 0, renderConfig.creep_radius);
creepGraphics.endFill();


function renderCreeps(){
    // Creeps
    map.creeps.forEach(creep => {
        // Handle deads
        // TODO death anim here?
        if(creep.dead && creep.sprite)
            creep.sprite.visible = false;
        else if(!creep.dead && creep.sprite && !creep.sprite.visible)
            creep.sprite.visible = true;

        // Spawn sprite for the first time
        if(!creep.sprite){
            creep.sprite = new PIXI.Sprite(creepGraphics.generateCanvasTexture());
            creep.sprite.anchor.x = creep.sprite.anchor.y = 0.5;
            app.stage.addChild(creep.sprite);
        }

        try {
            // Interpolate movement between grid squares
            let delta_time = Date.now() - map.last_update,
                tick_ratio = delta_time / map.config.tick_rate,
                tile = map.getCreepTile(creep),
                next_tile = map.getCreepNextTile(creep),
                delta_x = next_tile.x - tile.x,
                delta_y = next_tile.y - tile.y;

                // console.log("delta_time", delta_time);
                // console.log("TICK RATIO", tick_ratio);

            // Move sprite
            creep.sprite.x = (tile.x + delta_x * tick_ratio) * renderConfig.grid_size;
            creep.sprite.y = (tile.y + delta_y * tick_ratio) * renderConfig.grid_size;
        } catch (e) {
            // TODO what to do here
            //app.stage.removeChild(creep.sprite);
        }
    });
}

app.ticker.add(function() {
    // console.log("PIXI update");
    renderCreeps();
    app.renderer.render(app.stage);
});
