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
        this.gameStarted = true; //true para pruebas de un solo jugador el definitivo es false
        this.viewers = new Set();
        this.finishedPlayers = new Set();// variable para controla que todos pasen por la puerta 
        this.levelCompleted = false;
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
            return { success: false, message: "Sala llena" };
        }
        if (this.availableColors.length === 0) 
            return { success: false, message: "No hay colores disponibles" };
        
        
        //asigno color
        const color = this.availableColors.shift();

        //config del json game_data.json
        const playerConfig = this.world.sprites.find(s => s.type === "player1");
        if (!playerConfig) {
            return { success: false, 
            message: "Error: Configuración de jugador no encontrada" };
        }//probar si el jugador recibe bien la configuracion
     

        // 1. Definim els punts de sortida
       /* const spawnPoints = [
             { x: 70, y: 500 },
            { x: 120, y: 500 },
            { x: 170, y: 500 },
            { x: 220, y: 500 },
            { x: 270, y: 500 },
            { x: 320, y: 500 },
            { x: 370, y: 350 },
            { x: 420, y: 350 }
        ];*/
        //Calculem on ha d'aparèixer segons quants jugadors hi ha
        const spawnPoints = this.world.spawns;
        const spawn = spawnPoints[this.players.size % spawnPoints.length];
        
        //creo el jugador
        const player = new Player(
            id, 
            nickname, 
            ws, 
            spawn.x, 
            spawn.y, 
            color
        );
        this.players.set(id, player);
        console.log(`${nickname} tiene asignado el color ${color}`);


        // Si la partida ya empezó, enviamos el mundo al nuevo jugador al instante
        if (this.gameStarted) {
            ws.send(JSON.stringify({
                type: "WORLD_INIT",
                data: this.getWorldData() // Usamos el método que separamos antes
            }));
        } else {
            //
            ws.send(JSON.stringify({ type: "WAITING", message: "Esperando jugadores..." }));
        }

        return { success: true, player };
    }

    removePlayer(id) {
        const player = this.players.get(id);
        if (player) {
            // RECICLAJE: Devolvemos el color al banco
            //console.log(`${player.nickname} se ha  desconectado`);
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
    // mundo actualizado 
    getWorldData() {
    return {
        width: this.world.width,
        height: this.world.height,
        obstacles: this.world.obstacles,
        layers : this.world.layers,
        door: this.world.door,
        key: this.world.key
    };
}
    //estado del juego
    getState() {
        const holder = this.players.get(this.world.key.holderId);
        return {
            players: Array.from(this.players.values()).map(p => ({
                id: p.id,
                x: p.x,
                y: p.y,
                nickname: p.nickname,
                color: p.color
            })),
            key: {
                // Si hay portador, la llave sigue al jugador. 
                // Si no, se queda en su sitio original.
                x: holder ? holder.x : this.world.key.x,
                y: holder ? holder.y - 20 : this.world.key.y,
                collected: this.world.key.collected,
                holderId: this.world.key.holderId
            }
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
    // gestion llave quien la tiene 
    checkKeyCollision(p) {
        if (this.world.key.collected) return;

        if (this.isColliding(p, this.world.key)) {
            this.world.key.collected = true;
            this.world.key.holderId = p.id;

            console.log(`${p.nickname} ha cogido la llave`);

            this.broadcast("KEY_COLLECTED", {
                playerId: p.id
            });
        }
    }


    // ****GAME LOOP
  
    
    update() {
        // Lógica de inicio de partida
        if (!this.gameStarted && this.players.size >= this.minPlayers) {
            this.gameStarted = true;
            console.log("¡Partida iniciada!");
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

            // Colisión con obstáculos
            for (const obs of this.world.obstacles) {
                if (this.isColliding(p, obs)) {
                    p.x = prevX;
                    p.y = prevY;
             
                }
            }

            // LLAVE
            this.checkKeyCollision(p);

            // si la puerta aún está cerrada
            if (!this.world.door.opened && this.isColliding(p, this.world.door)) {

                const hasKey = this.world.key.holderId === p.id;
                
                if (!hasKey) {
                    //10 si no tiene llave el jugador rebota contra la puerta
                    p.x = prevX;
                    p.y = prevY;
                    p.vx = 0;
                } else {
                    //aqui controlo si el jugador que tiene la llave puede abrirla
                    this.world.door.opened = true;

                    console.log(`Puerta abierta por ${p.nickname}`);

                    this.broadcast("DOOR_OPENED", {
                        playerId: p.id
                    });
                }
            }
            

            // Colisión con otros jugadores (AHORA ESTÁ DENTRO DEL BUCLE)
            for (const other of this.players.values()) {
                if (p.id === other.id) continue; // No chocamos contra nosotros mismos

                if (this.isPlayerColliding(p, other)) {
                    // Lógica de apilamiento:
                    // 1. ¿El jugador se está moviendo hacia abajo (cayendo)?
                    // 2. ¿Su pie está por encima de la mitad del otro jugador?
                    if (p.vy > 0 && p.y + p.height < other.y + other.height / 2) {
                        // "Aterrizamos" al jugador encima del otro
                        p.y = other.y - p.height;
                        p.vy = 0;
                        p.onGround = true; // Permite saltar desde la cabeza de otro
                    } else {
                        // Colisión lateral normal (el jugador rebota/se bloquea)
                        p.x = prevX; 
    }
                }
            }
        }

        this.broadcast("STATE_UPDATE", this.getState()); //broadcast es para actualizar a los clientes que va pasando, lo que envio aqui players: [{ id, x, y, color, nickname }]} */
    }
    
}

module.exports = Sala;