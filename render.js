//// Require
const Map = require('./map.js');


let map = new Map();
console.log(map.config.width, map.config.height, map.config.bases);
map.gen();
console.log(map.toString());
