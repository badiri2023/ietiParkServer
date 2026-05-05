const levelData = require('./game_data.json');
const path = require('path');

class World {
    constructor(levelIndex = 0) {
        this.levelIndex = levelIndex;
        this.currentLevel = null;
        
        // Propiedades del estado del juego
        this.width = 0;
        this.height = 0;
        this.obstacles = [];
        this.spawns = [];
        this.door = null;
        this.key = null;
        this.palanca = null;

        this.loadLevel(levelIndex);
    }

    loadLevel(index) {
        const level = levelData.levels[index];
        if (!level) {
            console.error(`[ERROR] El nivel ${index} no existe en game_data.json`);
            return;
        }

        this.currentLevel = level;
        this.levelIndex = index;

        // 1. Configurar dimensiones según el Viewport del JSON
        this.width = level.viewportWidth || 1500;
        this.height = level.viewportHeight || 800;

        // 2. Cargar Física desde el archivo de Zonas (La clave del éxito)
        this.obstacles = [];
        try {
            // Intentamos cargar el archivo que indica la propiedad "zonesFile"
            // Nota: Asegúrate de que la ruta relativa sea correcta en tu servidor
            const zonesData = require(`./${level.zonesFile}`);
            
            if (zonesData && zonesData.zones) {
                // Filtramos las zonas de colisión (suelos y paredes)
                this.obstacles = zonesData.zones.filter(z => z.type === "Default");
                
                // Buscamos el punto de aparición oficial del nivel
                const spawnZone = zonesData.zones.find(z => z.type === "spawn");
                if (spawnZone) {
                    this.spawns = [{ x: spawnZone.x, y: spawnZone.y }];
                }
            }
            console.log(`[WORLD] Física cargada correctamente desde ${level.zonesFile}`);
        } catch (err) {
            console.warn(`[WARN] No se pudo cargar zonesFile (${level.zonesFile}). Usando datos de respaldo.`);
            // Backup: si falla el archivo de zonas, intentamos usar la posición del sprite player1
            const playerSprite = level.sprites.find(s => s.type === "player1" || s.type === "skeleton1");
            this.spawns = playerSprite ? [{ x: playerSprite.x, y: playerSprite.y }] : [{ x: 100, y: 100 }];
        }

        // 3. Cargar Objetos (Puerta, Llave, Palanca) desde Sprites
        const doorSprite = level.sprites.find(s => s.type === "door");
        this.door = doorSprite ? {
            x: doorSprite.x,
            y: doorSprite.y,
            width: doorSprite.width,
            height: doorSprite.height,
            opened: false
        } : null;

        const keySprite = level.sprites.find(s => s.type === "key");
        this.key = keySprite ? {
            x: keySprite.x,
            y: keySprite.y,
            width: keySprite.width,
            height: keySprite.height,
            collected: false,
            holderId: null
        } : { x: 0, y: 0, width: 32, height: 32, collected: true }; // Si no hay llave, marcar como recogida

        const palancaSprite = level.sprites.find(s => s.type === "palanca");
        this.palanca = palancaSprite ? {
            x: palancaSprite.x,
            y: palancaSprite.y,
            width: palancaSprite.width,
            height: palancaSprite.height,
            activated: false
        } : null;

        console.log(`[WORLD] Nivel cargado: ${level.name} (${this.width}x${this.height})`);
    }

    /**
     * Resetea el estado del nivel actual (por ejemplo si todos mueren)
     */
    resetLevelState() {
        this.loadLevel(this.levelIndex);
    }

    /**
     * Avanza al siguiente nivel si existe
     */
    nextLevel() {
        const nextIndex = this.levelIndex + 1;
        if (nextIndex < levelData.levels.length) {
            this.loadLevel(nextIndex);
            return true;
        }
        console.log("[WORLD] ¡Fin del juego! No hay más niveles.");
        return false;
    }

    /**
     * Función de utilidad para detectar colisiones con obstáculos
     * @param {Object} entity Objeto con x, y, width, height
     */
    checkObstacleCollision(entity) {
        for (const obs of this.obstacles) {
            if (entity.x < obs.x + obs.width &&
                entity.x + entity.width > obs.x &&
                entity.y < obs.y + obs.height &&
                entity.y + entity.height > obs.y) {
                return obs; // Retorna el obstáculo con el que choca
            }
        }
        return null;
    }
}

module.exports = World;