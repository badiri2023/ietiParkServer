const levelData = require('./game_data.json');
class World {
    constructor(levelIndex = 0) {
        this.levelIndex = levelIndex;
        this.currentLevel = null;
        this.width = 0;
        this.height = 0;
        
        this.obstacles = [];
        his.platforms = [];      // plataformas
        this.hazards = [];        // precipicios
        this.interactables = [];
        
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
        this.platforms = [];
        this.hazards = [];
        this.interactables = [];
        this.spawns = [];

        try {
            // Intentamos cargar el archivo que indica la propiedad "zonesFile"
            // Nota: Asegúrate de que la ruta relativa sea correcta en tu servidor
            const zonesData = require(`./${level.zonesFile}`);
            
            if (zonesData && zonesData.zones) {
                for (const z of zonesData.zones) {
                    switch (z.type) {

                        case "Default":
                            this.obstacles.push(z);
                            break;

                        case "plataforma":
                            this.platforms.push(z);
                            break;

                        case "precipicio":
                            this.hazards.push(z);
                            break;

                        case "spawn":
                            this.spawns.push({ x: z.x, y: z.y });
                            break;

                        case "key":
                        case "exitdoor":
                        case "palanca":
                            this.interactables.push(z);
                            break;
                    }
                }
            }

            console.log(`[WORLD] Cargado: ${level.zonesFile}`);
            } catch (err) {
                console.warn(`[WARN] No se pudo cargar: ${level.zonesFile}`);

                const fallback = this.sprites.find(
                    s => s.type === "player1" || s.type === "skeleton1"
                );

                this.spawns = fallback
                    ? [{ x: fallback.x, y: fallback.y }]
                    : [{ x: 100, y: 100 }];
        }
        /*} catch (err) {
            console.warn(`[WARN] No se pudo cargar zonesFile (${level.zonesFile}). Usando datos de respaldo.`);
            // Backup: si falla el archivo de zonas, intentamos usar la posición del sprite player1
            const playerSprite = level.sprites.find(s => s.type === "player1" || s.type === "skeleton1");
            this.spawns = playerSprite ? [{ x: playerSprite.x, y: playerSprite.y }] : [{ x: 100, y: 100 }];
        }*/

        //onsole.log("LEVELLLLL:", level);
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
        if (this.spawns.length === 0) {
        this.spawns = level.sprites
            .filter(s => s.type === "player1" || s.type === "skeleton1")
            .map(s => ({ x: s.x, y: s.y }));
        }

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