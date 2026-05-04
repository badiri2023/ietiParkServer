const levelData = require('./game_data.json');

class World {
    constructor() {

        const level = levelData.levels[0];

        this.sprites = level.sprites;
        this.layers = level.layers;

        // =========================
        // WORLD SIZE (FIJO, NO DINÁMICO)
        // =========================
        this.width = level.viewportWidth;
        this.height = level.viewportHeight;

        console.log("LEVEL SIZE:", this.width, this.height);

        // =========================
        // DOOR
        // =========================
        const doorSprite = level.sprites.find(s => s.type === "door");

        if (!doorSprite) {
            throw new Error("DOOR no encontrada en level data");
        }

        this.door = {
            x: doorSprite.x,
            y: doorSprite.y,
            width: doorSprite.width,
            height: doorSprite.height,
            opened: false
        };

        console.log("DOOR:", this.door);

        // =========================
        // SPAWNS
        // =========================
        this.spawns = level.sprites
            .filter(s => s.type === "player1")
            .map(s => ({
                x: s.x,
                y: s.y
            }));

        console.log("SPAWNS:", this.spawns);

        // =========================
        // KEY
        // =========================
        const keySprite = level.sprites.find(s => s.type === "key");

        this.key = {
            x: keySprite ? keySprite.x : 200,
            y: keySprite ? keySprite.y : 200,
            width: keySprite ? keySprite.width : 32,
            height: keySprite ? keySprite.height : 32,
            collected: false,
            holderId: null
        };

        console.log("KEY:", this.key);

        // =========================
        // OBSTACLES (futuro)
        // =========================
        this.obstacles = [];
    }
}

module.exports = World;