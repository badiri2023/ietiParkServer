const Player = require('./players');
const World = require('./world');
const COLORS = require('./colors');

class Sala {
    constructor(partidesCollection) {
        this.players = new Map();
        this.minPlayers = 2;
        this.maxPlayers = 8;

        this.world = new World();
        this.gameStarted = true; //true para pruebas de un solo jugador el definitivo es false
        this.viewers = new Set();
        this.finishedPlayers = new Set();// variable para controla que todos pasen por la puerta 
        
        this.levelCompleted = false;
        this.availableColors = [...COLORS];
       
        this.keyTakenInfo = null;
    
        this.partidaId = null;
        this.Partides = partidesCollection;


        // NIVEL 2 STADOS
        this.world.switchActivated = false;
        this.world.plataformaActivable = null;
        this.world.platform = {
            x: 657,
            y: 321,
            width: 162,
            height: 31,
            direction: 1,
            active: false
        };

        //  game loop (30 FPS) aqui controlo el tiempo de envio de posiciones 
        this.interval = setInterval(() => this.update(), 1000 / 30);
    }

    
    //******* JUGADORES********
   
    async addPlayer(id, nickname, ws) {
        
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
        
        const spawnIndex = this.players.size % this.world.spawns.length;
        const spawn = this.world.spawns[spawnIndex] || { x: 100, y: 100 };
        
        //creo el jugador
        const player = new Player(
            id, 
            nickname, 
            ws, 
            spawn.x, 
            spawn.y, 
            color,
            this.world
        
        );
        this.players.set(id, player);
    
        console.log(`${nickname} tiene asignado el color ${color}`);
        if (!this.partidaId) {
            this.partidaId = `partida_${Date.now()}`;

            await this.Partides.insertOne({
                _id: this.partidaId,
                players: []
            });
            //console.log("Partida creada:", this.partidaId);
        }
        await this.Partides.updateOne(
            { _id: this.partidaId },
            {
                $push: {
                    players: {
                        id,
                        nickname,
                        hasKey: false,
                    }
                }
            }
        );
        
       // console.log(`WORLD: ${this.world.width}x${this.world.height}`);
        // Si la partida ya empezó, enviamos el mundo al nuevo jugador al instante
        if (this.gameStarted) {
            const worldInitData = this.getWorldData(); 
            ws.send(JSON.stringify({
                type: "WORLD_INIT",
                data: this.getWorldData() // Usamos el método que separamos antes
            }));
        } else {
            //
            ws.send(JSON.stringify({ 
                type: "WAITING", 
                message: "Esperando jugadores..." }));
        }

        return { success: true, player };
    }
    removePlayer(id) {
        const player = this.players.get(id);
        if (!player) return;
        const nickname = player.nickname;
       if (this.world.key.holderId === id) {
            this.world.key.holderId = null;
            this.world.key.collected = false;

            this.broadcast("KEY_RESET", {
                reason: "PLAYER_LEFT"
            });
        }

        // eliminar jugador
        this.availableColors.push(player.color);
        this.players.delete(id);

        // eventos del juego
        this.broadcast("PLAYER_LEFT", {
            id,
            nickname
        });

        this.broadcast("PLAYER_LIST", this.getPlayerList());

        console.log(`Jugador ${nickname} desconectado`);
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

        return (
            player.x < rect.x + rect.width &&
            player.x + player.width > rect.x &&
            player.y < rect.y + rect.height &&
            player.y + player.height > rect.y
        );
    }

    // jugador vs jugador
    isPlayerColliding(a, b) {

        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
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
            key: this.world.key,
            palanca: this.world.palanca,
            platform: this.world.platform,
            plataformaActivable: this.world.plataformaActivable
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
                x: holder ? holder.x + (holder.width / 4) : this.world.key.x,
                y: holder ? holder.y + 50 : this.world.key.y, 
                collected: this.world.key.collected,
                holderId: this.world.key.holderId
            },

            door: this.world?.door ? {
            x: this.world.door.x,
            y: this.world.door.y,
            opened: this.world.door.opened
            } : null,
            palanca: this.world.palanca ? {
            x: this.world.palanca.x,
            y: this.world.palanca.y,
            width: this.world.palanca.width,
            height: this.world.palanca.height,
            activated: this.world.palanca.activated
            } : null,
            plataformaActivable: this.world.plataformaActivable
        };
    }
    //flutter 

    addViewer(ws) {
        this.viewers.add(ws);

        console.log("Observador conectado");

        ws.send(JSON.stringify({
        type: "WORLD_INIT",
        data: this.getWorldData()
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

    //****Key******** */
    // gestion llave quien la tiene 
    async checkKeyCollision(p) {
        if (this.world.key.collected) return;

        if (this.isColliding(p, this.world.key)) {
            this.world.key.collected = true;
            this.world.key.holderId = p.id;

            console.log(`${p.nickname} tiene la llave`);


            this.broadcast("KEY_COLLECTED", {
                playerId: p.id
            });
            this.saveKeyTaken(p);
        }
    }
    async checkPalancaCollision(p) {
        // Si no hay palanca o ya está activada, salimos
        if (!this.world.palanca || this.world.palanca.activated) return;

        // Detectamos si el jugador pasa por encima
        if (this.isColliding(p, this.world.palanca)) {
            this.world.palanca.activated = true;

        // Lógica mecánica: La plataforma móvil o activable aparece
            if (this.world.plataformaActivable) {
                this.world.plataformaActivable.visible = true;
                console.log(`[ ¡PALANCA ACTIVADA! El jugador ${p.nickname} ha tocado la palanca`);
                // Solo añadimos a obstáculos lo que SÍ debe ser sólido (la plataforma)
                this.world.obstacles.push(this.world.plataformaActivable);
            }

            this.broadcast("SWITCH_ACTIVATED", {
                playerId: p.id,
                nickname: p.nickname
            });
            await this.savePalancaActivated(p);
        }
    }


    // ****GAME LOOP
    update() {
        //------------------Inicio de partida
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

        ///plataforma activable
        if (this.world.palanca?.activated && this.world.platform) {
            this.world.platform.x += 2 * this.world.platform.direction;
            if (Math.abs(this.world.platform.x - 657) > 200) { 
                this.world.platform.direction *= -1;
            }
        }

        //array jugadores para este frame
        const playersList = Array.from(this.players.values());
        
        //------------------actualizacion players
        for (const p of this.players.values()) {
            //console.log(`[PLAYER>>>] ${p.nickname} -> X:${p.x.toFixed(2)} Y:${p.y.toFixed(2)}`);
            const prevX = p.x;
            const prevY = p.y;
            //suaviso caida 
            if (p.falling) {
                p.fallTimer--;
                p.vy += 2;
                if (p.fallTimer <= 0) {
                    const spawn = this.world.spawns[0] || { x: 100, y: 100 };
                    p.x = spawn.x;
                    p.y = spawn.y;
                    p.vx = 0;
                    p.vy = 0;
                    p.falling = false;
                }
                continue; // evita que siga colisionando mientras cae
            }

            p.update(); // Actualizamos físicas osea mover jugador, aplicar gravedad y actualizo x,y

            //-----------------precipicio
            for (const h of this.world.hazards) {
                if (this.isColliding(p, h) && !p.falling) {
                    console.log(`${p.nickname} cayó al precipicio`);
                    // activar estado de caída
                    p.falling = true;
                    p.fallTimer = 15; // frames (~0.5s a 30fps)
                    p.vx = 0;
                    p.vy = 0;
                }
            }

            

            //activar plataforma
            if (this.world.switchActivated && this.world.platform) {
                // Velocidad de la plataforma (2 píxeles por frame)
                this.world.platform.x += 2 * this.world.platform.direction;

                // Límites para que vaya y vuelva por el precipicio
                // El precipicio está entre x=448 y x=896
                if (this.world.platform.x > 850) this.world.platform.direction = -1; // Rebota a la derecha
                if (this.world.platform.x < 450) this.world.platform.direction = 1;  // Rebota a la izquierda
            }
            if (this.world.palanca?.activated && this.isColliding(p, this.world.platform)) {
                if (p.vy >= 0 && p.y + p.height <= this.world.platform.y + 10) {
                    p.y = this.world.platform.y - p.height;
                    p.vy = 0;
                    p.onGround = true;
                    p.x += 2 * this.world.platform.direction; // Mueve al jugador con la plataforma
                }
            }


            // *****Key******
            this.checkKeyCollision(p);

            //palanca
            this.checkPalancaCollision(p);
            //*****Puerta
            if (this.world?.door && !this.world.door.opened && this.isColliding(p, this.world.door)) {
                const hasKey = this.world.key.holderId === p.id;
                
                if (!hasKey) {
                    //si no tiene llave el jugador rebota contra la puerta
                    p.x = prevX;
                    p.vx = 0;
                    console.log(`${p.nickname} no puedes pasar, no tienes la llave\n`);
                } else {
                    //aqui controlo si el jugador que tiene la llave puede abrirla
                    this.world.door.opened = true;
                    console.log(`Puerta abierta por ${p.nickname}`);
                    this.broadcast("DOOR_OPENED", {
                        playerId: p.id
                    });
                }
            }
            
            //detectar  quien cruza la puerta
            if (this.world?.door?.opened && this.isColliding(p, this.world.door)) {
                if (!p.finished) {
                    p.finished = true;

                    console.log(`${p.nickname} ha cruzado la puerta`);

                    this.broadcast("PLAYER_EXITED", {
                        playerId: p.id
                    });
                    this.savePlayerExit(p);

                    if (this.world.currentLevelIndex === 1) {
                        console.log("**** FIN DIRECTO ****");

                        this.broadcast("GAME_OVER", {
                            type: "FIN",
                            message: "¡HAS GANADO!"
                        });

                        this.levelCompleted = true;
                        return;
                    }
                }
              
            }
           
             // Colisión con obstáculos
            for (const obs of this.world.obstacles) {
                if (this.isColliding(p, obs)) {
                    p.x = prevX;
                    p.y = prevY;
             
                }
            }

            // Colisión con otros jugadores
            for (const other of this.players.values()) {
                if (p.id === other.id) continue; // No chocamos contra nosotros mismos

                if (this.isPlayerColliding(p, other)) {
                    //if (p.vy > 0 && p.y + p.height < other.y + other.height / 2) {
                    if (p.vy > 0 && p.y + p.height < other.y + 45) {
                        p.y = other.y - p.height;
                        p.vy = 0;
                        p.onGround = true; // Permite saltar desde la cabeza de otro
                    } else {
                        // Colisión lateral normal (el jugador rebota/se bloquea)
                        p.x = prevX; 
                    }
                }
                if (p.y > this.world.height + 100) {
                    this.resetPlayerToSpawn(p);
                }
            }
        }
        //*****Nivel completado
        const allFinished = playersList.length > 0 && playersList.every(p => p.finished);
        //aqui se controla que todos pasen la puerta y cambiamos de nivel
        if (allFinished && !this.levelCompleted) {

            this.levelCompleted = true;
            console.log("Cambiando a nivel 2...");
            const moved = this.world.nextLevel();

            if(!moved){
                console.log("terminado")
                return;
            }
         
            
            // reseteo jugadores
            const playerUpdates = [];
            let spawnIndex = 0;
            for (const p of this.players.values()) {

                const spawnBase = this.world.spawns[spawnIndex % this.world.spawns.length] || { x: 100, y: 100 };
    
                const extraOffset = Math.floor(spawnIndex / this.world.spawns.length) * 40;

                p.x = spawnBase.x + extraOffset;
                p.y = spawnBase.y;
                p.vx = 0;
                p.vy = 0;
                p.finished = false;
                p.falling = false;

                spawnIndex++;
            }

           this.broadcast("CHANGE_LEVEL", {
            world: this.getWorldData(),
            players: this.getState().players
            });
            

            return;
        }
        this.broadcast("STATE_UPDATE", this.getState()); //broadcast es para actualizar a los clientes que va pasando, lo que envio aqui players: [{ id, x, y, color, nickname }]} */
        
    }

    async saveKeyTaken(player) {
        try {
            if (!this.Partides || !this.partidaId) return;

            await this.Partides.updateOne(
                {
                    _id: this.partidaId,
                    "players.id": player.id
                },
                {
                    $set: {
                        "players.$.hasKey": true
                    }
                }
            );

        } catch (err) {
            console.error("Error guardando key en Mongo:", err);
        }
    }
    async savePlayerExit(player) {
    try {
        if (!this.Partides || !this.partidaId) return;

        await this.Partides.updateOne(
            {
                _id: this.partidaId,
                "players.id": player.id
            },
            {
                $set: {
                    "players.$.finished": true
                }
            }
        );
            
        } catch (err) {
            console.error("Error al guardar salida en Mongo:", err);
        }
    }

    async savePalancaActivated(player) {
        try {
            if (!this.Partides || !this.partidaId) return;

            // Marcamos en la base de datos qué jugador activó el mecanismo
            await this.Partides.updateOne(
                {
                    _id: this.partidaId,
                    "players.id": player.id
                },
                {
                    $set: {
                        "players.$.activatedSwitch": true,
                        "lastAction": `Palanca activada por ${player.nickname}`
                    }
                }
            );
        
        } catch (err) {
            console.error("Error al guardar activación de palanca en Mongo:", err);
        }
    }
    resetPlayerToSpawn(p) {
        const spawn = this.world.spawns[0] || { x: 100, y: 100 };
        p.x = spawn.x;
        p.y = spawn.y;
        p.vx = 0;
        p.vy = 0;
    }
    
}

module.exports = Sala;