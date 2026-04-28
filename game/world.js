const levelData = require('./game_data.json');
class World {
    constructor() {
        const level = levelData.levels[0];
        this.sprites = level.sprites;
        this.layers = level.layers;

        this.width = level.viewportWidth ; 
        this.height = level.viewportHeight ;

        // PUERTA
        const doorSprite = level.sprites.find(s => s.type === "door");

        this.door = {
            x: doorSprite.x,
            y: doorSprite.y,
            width: doorSprite.width,
            height: doorSprite.height,
            opened :false
        };

        //  SPAWNS (jugadores)
        this.spawns = level.sprites
            .filter(s => s.type === "player1")
            .map(s => ({
                x: s.x,
                y: s.y
            }));

        //  OBSTÁCULOS (por ahora vacío)
        this.obstacles = [];
        //key 13 gestiono estado key
        const keySprite = level.sprites.find(s => s.type === "key");
        // En World.js
        console.log("Spawn encontrado:", level.sprites.find(s => s.type === "player1"));
        
        this.key = {
            x: keySprite ? keySprite.x : 200,
            y:  keySprite ? keySprite.y : 300,
            width: keySprite.width,
            height:keySprite.height,
            collected: false,
            holderId: null
        };
     
    }
}

module.exports = World;