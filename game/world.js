const levelData = require('./game_data.json');
class World {
    constructor() {
        const level = levelData.levels[0];
        this.sprites = level.sprites;
        this.layers = level.layers;

        
        console.log("LEVEL:", level);
        console.log("SPRITES:", level.sprites);
        console.log("WORLD SIZE:", this.width, this.height);
        // PUERTA
        const doorSprite = level.sprites.find(s => s.type === "door");
        //this.width = Math.max(...level.sprites.map(s => s.x + s.width));
        //this.height = Math.max(...level.sprites.map(s => s.y + s.height));
        this.width=800;
        this.height=400;

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
        console.log("Mundo iniciado con éxito:");
        console.log("- Puerta en:", this.door.x, this.door.y);
        console.log("- Spawn en:", this.spawns[0]);
        //key 13 gestiono estado key
        const keySprite = level.sprites.find(s => s.type === "key");
    
        console.log("Spawn encontrado:", level.sprites.find(s => s.type === "player1"));
        
        this.key = {
            x: keySprite ? keySprite.x : 200,
            y:  keySprite ? (keySprite.y - 150) : 150,
            width: keySprite.width,
            height:keySprite.height,
            collected: false,
            holderId: null
        };
     
    }
}

module.exports = World;