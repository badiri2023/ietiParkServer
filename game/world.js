const levelData = require('./game_data.json');
class World {
    constructor(levelIndex = 0) {
        this.levelIndex = levelIndex;
        this.loadLevel(levelIndex);
    }
    loadLevel(index) {
        const level = levelData.levels[index];
        if (!level) {
            console.error("Nivel no existe:", index);
            return;
        }
        


        this.currentLevel = level;
        this.sprites = level.sprites || [];
        this.layers = level.layers || [];

        ///#####hablar con Bad para medidas del mundo por que el nivel 2 es mas grande
        //tamaño mundo lo ajuste por que el viewport es muy pequeño 
        this.width = level.viewportWidth;
        this.height = level.viewportHeight;
     
        //onsole.log("LEVELLLLL:", level);
        // reset total por nivel
        //this.width =  1500;
        //this.height =  600;


        //-----Puerta-------
        const doorSprite = level.sprites.find(s => s.type === "door");
        this.door = doorSprite ? {
            x: doorSprite.x,
            y: doorSprite.y,
            width: doorSprite.width,
            height: doorSprite.height,
            opened: false
        } : null;

        ///------spawns------
        this.spawns = level.sprites
            .filter(s => s.type === "player1"|| s.type === "skeleton1")
            .map(s => ({
                x: s.x,
                y: s.y
            }));

        //-----key-----
        const keySprite = level.sprites.find(s => s.type === "key");
        this.key = {
            x: keySprite ? keySprite.x : 200,
            y:  keySprite ? (keySprite.y - 50) : 50,
            width: keySprite.width,
            height: keySprite ? (keySprite.height + 80) : 112,            
            collected: false,
            holderId: null
        };

        //palanca nivel 2


        const palancaSprite = this.sprites.find(s => s.type === "palanca");
        this.palanca = palancaSprite ? {
            x: palancaSprite.x,
            y: palancaSprite.y,
            width: palancaSprite.width,
            height: palancaSprite.height,
            activated: false
        } : null;


            //  OBSTÁCULOS (por ahora vacío), para segundo nivel
        this.obstacles = [];
        console.log(`Nivel cargado: ${level.name}`);
    }
    resetLevelState() {
        this.door = null;
        this.key = null;
        this.palanca = null;
        this.obstacles = [];
    }

    nextLevel() {
        const next = this.levelIndex + 1;

        if (next >= levelData.levels.length) {
            console.log("No hay más niveles");
            return false;
        }

        this.levelIndex = next;
        this.loadLevel(next);
        return true;
    }      
        
    

}

module.exports = World;