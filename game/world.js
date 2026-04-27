const levelData = require('./game_data.json');
class World {
    constructor() {
        const level = levelData.levels[0];

        // Tamaño (puedes ajustar esto luego)
        this.width = level.viewportWidth;
        this.height = level.viewportHeight;

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
        //key
        const keySprite = level.sprites.find(s => s.type === "key");
        
        /*this.key = {
            x: keySprite ? keySprite.x : 200,
            y:  keySprite ? keySprite.y : 300,
            width: keySprite.width,
            height:keySprite.heigh,
            collected: false,
            holderId: null
        };*/
    }
}

module.exports = World;