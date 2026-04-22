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
        this.gameStarted = false; //true para pruebas 
        this.viewers = new Set();
        this.availableColors = [...COLORS];
        //  game loop (30 FPS) aqui controlo el tiempo de envio de posiciones 
        this.interval = setInterval(() => this.update(), 1000 / 80);
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
             { x: 70, y: 350 },
            { x: 120, y: 350 },
            { x: 170, y: 350 },
            { x: 220, y: 350 },
            { x: 270, y: 350 },
            { x: 320, y: 350 },
            { x: 370, y: 350 },
            { x: 420, y: 350 }
        ];
        //Calculem on ha d'aparèixer segons quants jugadors hi ha
        const spawn = spawnPoints[this.players.size % spawnPoints.length];
        //creo el jugador
        const player = new Player(id, nickname, ws, spawn.x, spawn.y, color);
        this.players.set(id, player);
        console.log(` ${nickname} con  color ${color}`);


        // Si la partida ya empezó, enviamos el mundo al nuevo jugador al instante
        if (this.gameStarted) {
            ws.send(JSON.stringify({
                type: "WORLD_INIT",
                data: this.getWorldData() // Usamos el método que separamos antes
            }));
        } else {
            // Opcional: Avisar al cliente que está en modo espera
            ws.send(JSON.stringify({ type: "WAITING", message: "Esperando jugadores..." }));
        }

        return { success: true, player };
        }

    removePlayer(id) {
        const player = this.players.get(id);
        if (player) {
            // RECICLAJE: Devolvemos el color al banco
            console.log(`${player.nickname} se ha  desconectado`);
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
         for (const v of this.viewers) {
            if (v.readyState === WebSocket.OPEN) {
                v.send(msg);
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
    // mudo actualizado 
    getWorldData() {
    return {
        width: this.world.width,
        height: this.world.height,
        obstacles: this.world.obstacles,
        door: this.world.door
    };
}
    //estado del juego
    getState() {
        return {
            players: Array.from(this.players.values()).map(p => ({
                id: p.id,
                x: p.x,
                y: p.y,
                nickname: p.nickname,
                color: p.color
            }))
        };
    }
    //flutter 

   addViewer(ws) {
        this.viewers.add(ws);

        console.log("Observador conectado");

        ws.send(JSON.stringify({
            type: "WORLD_INIT",
            data: {
                width: this.world.width,
                height: this.world.height,
                obstacles: this.world.obstacles,
                door: this.world.door
            }
        }));

        ws.send(JSON.stringify({
            type: "STATE_UPDATE",
            data: this.getState()
        }));
    }

    removeViewer(ws) {
        this.viewers.delete(ws);
        console.log("Observador desconectado");
    }


    // ****GAME LOOP
  
    
    update() {
        // Lógica de inicio de partida
        if (!this.gameStarted && this.players.size >= this.minPlayers) {
            this.gameStarted = true;
            console.log("¡Partida iniciada! Enviando mundo a todos.");
            //se envia el mundo cuando esten todoss
            const worldData = this.getWorldData();
            this.broadcast("WORLD_INIT", worldData);
            this.broadcast("GAME_START", {});
        }

        // Si la partida no ha empezado, no movemos a nadie
        if (!this.gameStarted) return;


        
        for (const p of this.players.values()) {
            const prevX = p.x;
            const prevY = p.y;

            p.update(); // Actualizamos físicas osea mover jugador, aplicar gravedad y actualizo x,y

            // 1. Colisión con obstáculos
            for (const obs of this.world.obstacles) {
                if (this.isColliding(p, obs)) {
                    p.x = prevX;
                    p.y = prevY;
             
                }
            }

            // 2. Colisión con puerta impide avanzar P,10
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

        this.broadcast("STATE_UPDATE", this.getState()); //broadcast es para actualizar a los clientes que va pasando, lo que envio aqui players: [{ id, x, y, color, nickname }]} */
    }
    
}

module.exports = Sala;