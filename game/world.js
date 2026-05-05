const levelData = require('./game_data.json');
class World {
    constructor(levelIndex = 0) {
        this.levelIndex = levelIndex;
        this.currentLevel = null;
        this.width = 0;
        this.height = 0;
        
        this.obstacles = [];//paredes suelo
        this.voidZones = []; //precipicio
        this.spawns = [];
        
        this.door = null;
        this.key = null;
        this.palanca = null;

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
        
        this.width = 1000;
        this.height = 600;

        // Cargar Física desde el archivo de Zonas (La clave del éxito)
        this.obstacles = [];
        this.voidZones = [];
        this.spawns = [];
        //let zonesData = null;
        try {
            zonesData = require(`./${level.zonesFile}`);

            if (zonesData?.zones) {

                // suelos / paredes / plataformas sólidas
                this.obstacles = zonesData.zones.filter(z =>
                    z.type === "Default" || z.type === "plataforma"
                );

                // precipicios (caída)
                this.voidZones = zonesData.zones.filter(
                    z => z.type === "precipicio"
                );

                // spawn desde zonas
                const spawnZone = zonesData.zones.find(z => z.type === "spawn");

                if (spawnZone) {
                    this.spawns.push({
                        x: spawnZone.x,
                        y: spawnZone.y
                    });
                }
            }

        } catch (err) {
            console.warn(`[WORLD] zonesFile falló: ${level.zonesFile}`);

        }
        // ---------------- FALLBACK SPAWN ----------------
        if (this.spawns.length === 0) {
            const fallback = this.sprites.find(
                s => s.type === "player1" || s.type === "skeleton1"
            );

            if (fallback) {
                this.spawns = [{ x: fallback.x, y: fallback.y }];
            } else {
                this.spawns = [{ x: 100, y: 100 }];
            }
        }




        console.log("LEVELLLLL:", level);
        //-----Puerta-------
        const doorSprite = level.sprites.find(s => s.type === "door");
        
        this.door = doorSprite ? {
            x: doorSprite.x,
            y: doorSprite.y,
            width: doorSprite.width,
            height: doorSprite.height,
            opened: false
        } : null;

        //-----key-----
        const keySprite = level.sprites.find(s => s.type === "key");
        this.key = keySprite ? {
            x: keySprite.x,
            y: keySprite.y,
            width: keySprite.width,
            height: keySprite.height,
            collected: false,
            holderId: null
        } : { x: 0, y: 0, width: 32, height: 32, collected: true }; // Si no hay llave, marcar como recogida

        //palanca nivel 2


        const palancaSprite = this.sprites.find(s => s.type === "palanca");
        this.palanca = palancaSprite ? {
            x: palancaSprite.x,
            y: palancaSprite.y,
            width: palancaSprite.width,
            height: palancaSprite.height,
            activated: false
        } : null;
        console.log(`Nivel cargado: ${level.name}`);
    }

    resetLevelState() {
        this.loadLevel(this.levelIndex);
        /*if (this.door) this.door.opened = false;

        if (this.key) {
            this.key.collected = false;
            this.key.holderId = null;
        }*/ 
    }

    nextLevel() {
        const nextIndex = this.levelIndex + 1;
        if (nextIndex < levelData.levels.length) {
            this.loadLevel(nextIndex);
            return true;
        }
        console.log("[WORLD] ¡Fin del juego! No hay más niveles.");
        return false;
    }

}

module.exports = World;