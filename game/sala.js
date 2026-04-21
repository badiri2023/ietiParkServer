const WebSocket = require('ws');
const Player = require('./players');
const World = require('./world');
const COLORS = require('./colors');



class Sala {
    constructor() {
        this.players = new Map();
        this.minPlayers = 2;
        this.maxPlayers = 8;
        this.world = new World();
        this.gameStarted = true;
        this.viewers = new Set();
        this.availableColors = [...COLORS];
        //  game loop (30 FPS) aqui controlo el tiempo de envio de posiciones 
        this.interval = setInterval(() => this.update(), 1000 / 30);
    }

    
    //******* JUGADORES********
   
    addPlayer(id, nickname, ws) {
        const nameTaken = Array.from(this.players.values()).some(p => p.nickname === nickname);
        if (nameTaken) {
            return { success: false, message: "El nickname ya existe" };
        }
        
        if (this.players.size >= this.maxPlayers) {
            return { success: false, message: "Sala plena" };
        }
        if (this.availableColors.length === 0) 
            return { success: false, message: "No hay colores disponibles" };
        //asigno color
        const color = this.availableColors.shift();

        // 1. Definim els punts de sortida
        const spawnPoints = [
            { x: 100, y: 0 },
            { x: 200, y: 0 },
            { x: 300, y: 0 },
            { x: 400, y: 0 } 
        ];
        //Calculem on ha d'aparèixer segons quants jugadors hi ha
        const spawn = spawnPoints[this.players.size % spawnPoints.length];

        const player = new Player(id, nickname, ws, spawn.x, spawn.y, color);
        this.players.set(id, player);

        return { success: true };
    }

    removePlayer(id) {
        const player = this.players.get(id);
        if (player) {
            // RECICLAJE: Devolvemos el color al banco
            this.availableColors.push(player.color);
            this.players.delete(id);
        }
    }

    getPlayer(id) {
        return this.players.get(id);
    }

    getPlayerList() {
        return Array.from(this.players.values()).map(p => ({
            id: p.id,
            nickname: p.nickname
        }));
    }

    // **********broadcast***********

    broadcast(type, data) {
        const msg = JSON.stringify({ type, data });

        for (const p of this.players.values()) {
            if (p.ws.readyState === WebSocket.OPEN) {
                p.ws.send(msg);
            }
        }
    }


        // **********colisiones***********
    isColliding(player, rect) {
        const size = 40; // tamaño jugador

        return (
            player.x < rect.x + rect.width &&
            player.x + size > rect.x &&
            player.y < rect.y + rect.height &&
            player.y + size > rect.y
        );
    }

    // jugador vs jugador
    isPlayerColliding(a, b) {
        const size = 40;

        return (
            a.x < b.x + size &&
            a.x + size > b.x &&
            a.y < b.y + size &&
            a.y + size > b.y
        );
    }
    //estado del juego
     getState() {
        return {
            world: {
                width: this.world.width,
                height: this.world.height,
                obstacles: this.world.obstacles,
                door: this.world.door
            },
            players: Array.from(this.players.values()).map(p => ({
                id: p.id,
                x: p.x,
                y: p.y,
                color: p.color,
                nickname: p.nickname
            }))
        };
    }



    // ****GAME LOOP
  
    
    update() {
        // Lógica de inicio de partida
        if (!this.gameStarted && this.players.size >= this.minPlayers) {
            this.gameStarted = true;
            console.log("¡Partida iniciada!");
        }

        // Si la partida no ha empezado, no movemos a nadie
        if (!this.gameStarted) return;


        
        for (const p of this.players.values()) {
            const prevX = p.x;
            const prevY = p.y;

            p.update(); // Actualizamos físicas

            // 1. Colisión con obstáculos
            for (const obs of this.world.obstacles) {
                if (this.isColliding(p, obs)) {
                    p.x = prevX;
                    p.y = prevY;
                }
            }

            // 2. Colisión con puerta
            if (this.isColliding(p, this.world.door)) {
                p.x = prevX;
                p.y = prevY;
                p.vx = 0; // Cambiado de p.pv a p.vx para detener movimiento
            }

            // 3. Colisión con otros jugadores (AHORA ESTÁ DENTRO DEL BUCLE)
            for (const other of this.players.values()) {
                if (p.id === other.id) continue; // No chocamos contra nosotros mismos

                if (this.isPlayerColliding(p, other)) {
                    p.x = prevX;
                    p.y = prevY;
                }
            }
        }

        this.broadcast("STATE_UPDATE", this.getState());
    }
    
}

module.exports = Sala;