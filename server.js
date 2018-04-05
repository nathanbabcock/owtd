const
    Map = require('./map.js');

let map = new Map();
map.gen();
console.log(map.toString());

for(let i = 0; i < 20; i++)
    map.update();