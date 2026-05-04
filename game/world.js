const levelData = require('./game_data.json');

class World {
    constructor(levelIndex = 0) {
        this.levelIndex = levelIndex;
        this.loadLevel(levelIndex);
    }

    loadLevel(index) {
        // 1. Obtenemos el objeto del nivel completo, NO solo las zonas
        const level = levelData.levels[index];
        
        if (!level) {
            console.error("El nivel no existe en el índice:", index);
            return;
        }

        // 2. Limpiamos estado anterior
        this.resetLevelState();

        // 3. Asignamos propiedades con valores por defecto por seguridad
        this.currentLevel = level;
        this.sprites = level.sprites || [];
        this.layers = level.layers || [];
        this.zones = level.zones || [];
        
        // Medidas del mundo
        this.width = level.viewportWidth || 1500;
        this.height = level.viewportHeight || 600;

        // 4. Buscar la PUERTA (Ajustado a "exitdoor" si así está en tu JSON)
        const doorSprite = this.sprites.find(s => s.type === "door" || s.type === "exitdoor");
        this.door = doorSprite ? {
            x: doorSprite.x,
            y: doorSprite.y,
            width: doorSprite.width,
            height: doorSprite.height,
            opened: false
        } : null;

        // 5. SPAWNS
        this.spawns = this.sprites
            .filter(s => s.type === "player1" || s.type === "skeleton1" || s.type === "spawn")
            .map(s => ({ x: s.x, y: s.y }));

        // 6. LLAVE
        const keySprite = this.sprites.find(s => s.type === "key");
        this.key = {
            x: keySprite ? keySprite.x : 200,
            y: keySprite ? keySprite.y : 50,
            width: keySprite ? keySprite.width : 50,
            height: keySprite ? keySprite.height : 50,
            collected: false,
            holderId: null
        };

        // 7. PALANCA (Nivel 2)
        const palancaSprite = this.sprites.find(s => s.type === "palanca");
        this.palanca = palancaSprite ? {
            x: palancaSprite.x,
            y: palancaSprite.y,
            width: palancaSprite.width,
            height: palancaSprite.height,
            activated: false
        } : null;

        // 8. PLATAFORMA MÓVIL (Basada en zonas del Nivel 2)
        const platZone = this.zones.find(z => z.type === "plataforma");
        this.movingPlatform = platZone ? {
            x: platZone.x,
            y: platZone.y,
            width: platZone.width,
            height: platZone.height,
            direction: 1,
            speed: 2
        } : null;

        // 9. PRECIPICIO (Basada en zonas del Nivel 2)
        const precipicioZone = this.zones.find(z => z.type === "precipicio");
        this.precipicio = precipicioZone ? {
            x: precipicioZone.x,
            y: precipicioZone.y,
            width: precipicioZone.width,
            height: precipicioZone.height
        } : null;

        // 10. OBSTÁCULOS (Suelos)
        this.obstacles = this.zones
            .filter(z => z.name === "suelo")
            .map(z => ({ x: z.x, y: z.y, width: z.width, height: z.height }));

        console.log(`Nivel cargado correctamente: ${level.name || index}`);
    }

    resetLevelState() {
        this.door = null;
        this.key = null;
        this.palanca = null;
        this.movingPlatform = null;
        this.precipicio = null;
        this.obstacles = [];
    }

    nextLevel() {
        const next = this.levelIndex + 1;
        if (next >= levelData.levels.length) {
            console.log("Fin del juego: No hay más niveles");
            return false;
        }
        this.levelIndex = next;
        this.loadLevel(next);
        return true;
    }
}

module.exports = World;