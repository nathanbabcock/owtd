const
    Map = require('./map.js');

let map = new Map();
map.gen();
// console.log(map.toString());

map.update();
console.log(map.toString());