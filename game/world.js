const fs = require('fs');
const path = require('path');
const gameData = require('./game_data.json'); // El JSON principal que pasaste

class World {
    constructor(levelIndex = 0) {
        this.levelIndex = levelIndex;
        this.loadLevel(levelIndex);
    }

    loadLevel(index) {
        const level = gameData.levels[index];
        if (!level) {
            console.error(`[ERROR] No existe el nivel en el índice: ${index}`);
            return;
        }

        this.resetLevelState();
        this.currentLevel = level;

        // --- CARGA DINÁMICA DEL ARCHIVO DE ZONAS ---
        try {
            // Buscamos el archivo que dice "zonesFile" (ej: zones/level_000_zones.json)
            const absolutePath = path.join(__dirname, level.zonesFile);
            const zonesRaw = fs.readFileSync(absolutePath, 'utf8');
            const zonesData = JSON.parse(zonesRaw);
            this.zones = zonesData.zones || [];
            
            console.log(`[WORLD] Cargado ${level.name}. Zonas leídas de: ${level.zonesFile}`);
        } catch (err) {
            console.error(`[ERROR] No se pudo cargar el archivo de zonas: ${level.zonesFile}`);
            this.zones = [];
        }

        // --- PROCESAR OBSTÁCULOS (Colisiones de suelo) ---
        // Filtramos por el nombre "suelo" que vimos en tu JSON de zonas
        this.obstacles = this.zones
            .filter(z => z.name === "suelo" || z.type === "Default")
            .map(z => ({
                x: z.x,
                y: z.y,
                width: z.width,
                height: z.height
            }));

        // --- SPAWNS ---
        const spawnZ = this.zones.find(z => z.type === "spawn");
        this.spawns = spawnZ ? [{ x: spawnZ.x, y: spawnZ.y }] : [{ x: 100, y: 100 }];

        // --- PUERTA ---
        const doorZ = this.zones.find(z => z.type === "exitdoor");
        this.door = doorZ ? {
            x: doorZ.x,
            y: doorZ.y,
            width: doorZ.width,
            height: doorZ.height,
            opened: false
        } : null;

        // --- LLAVE ---
        const keyZ = this.zones.find(z => z.type === "key");
        this.key = {
            x: keyZ ? keyZ.x : 0,
            y: keyZ ? keyZ.y : 0,
            width: keyZ ? keyZ.width : 32,
            height: keyZ ? keyZ.height : 32,
            collected: false,
            holderId: null
        };

        // --- PALANCA (Para el Nivel 2) ---
        const palancaZ = this.zones.find(z => z.type === "palanca");
        this.palanca = palancaZ ? {
            x: palancaZ.x,
            y: palancaZ.y,
            width: palancaZ.width,
            height: palancaZ.height,
            activated: false
        } : null;

        // Ajustamos dimensiones del mundo para el servidor
        this.width = 2000; 
        this.height = 600;
    }

    resetLevelState() {
        this.obstacles = [];
        this.zones = [];
        this.door = null;
        this.key = null;
        this.palanca = null;
    }

    nextLevel() {
        const next = this.levelIndex + 1;
        if (next < gameData.levels.length) {
            this.levelIndex = next;
            this.loadLevel(this.levelIndex);
            return true;
        }
        return false;
    }
}

module.exports = World;