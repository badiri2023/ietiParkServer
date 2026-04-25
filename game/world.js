const levelData = require('./level.json');
class World {
    constructor() {
        const level = levelData.levels[0];

        // Tamaño (puedes ajustar esto luego)
        this.width = 700;
        this.height = 500;

        // PUERTA
        const doorSprite = level.sprites.find(s => s.type === "door");

        this.door = {
            x: doorSprite.x,
            y: doorSprite.y,
            width: doorSprite.width,
            height: doorSprite.height
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

        this.key = {
            x: 200,
            y: 300,
            width: 30,
            height: 30,
            collected: false
        };
    }
}

module.exports = World;