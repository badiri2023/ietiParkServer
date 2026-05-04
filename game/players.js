class Player {
    ///tambien tiene que tener un color 
    constructor(id, nickname, ws, spawnX, spawnY, color, world) {
        this.id = id;
        this.nickname = nickname;
        this.ws = ws;

        // POSICIÓN: Viene de los cálculos de tu Sala
        this.x = spawnX;
        this.y = spawnY;
        // hitbox de los jugadores
        this.width = 30;
        this.height = 90;
 
        // PROPIEDADES
        this.vx = 0;
        this.vy = 0;
        this.color = color;
        this.finished = false;
        this.input = { left: false, right: false, jump: false };
        this.onGround = false;
        this.worldWidth = world.width;  // Ajusta según tu mapa
        this.worldHeight = world.height;
        
    }
 

    setColor(color) {
        this.color = color;
    }

    // Actualización por tick
    update() {
        //si cruzó la puerta se bloque el jugador
        if (this.finished) {
            this.vx = 0;
            this.vy = 0;
            /*this.input.left = false;
            this.input.right = false;
            this.input.jump = false;*/
            return;
        }

        //revisar para mejorar la friccion
        /*const accel = 0.5;
const maxSpeed = 5;
const friction = 0.8;

if (this.input.left) this.vx -= accel;
if (this.input.right) this.vx += accel;

// límite velocidad
this.vx = Math.max(-maxSpeed, Math.min(maxSpeed, this.vx));

// fricción
if (!this.input.left && !this.input.right) {
    this.vx *= friction;
}*/ 
        //SERVER: Implementació dels salts i col·lisions entre usuaris (“s’apilen” un sobre l’altre) 
       const speed = 5;

        // ✔ gravedad coherente con canvas (Y hacia abajo)
        const gravity = 0.8;

        // ✔ salto negativo (sube)
        const jumpForce = -15;

        // --- MOVIMIENTO HORIZONTAL ---
        if (this.input.left) this.vx = -speed;
        else if (this.input.right) this.vx = speed;
        else this.vx = 0;

        // --- SALTO ---
        if (this.input.jump && this.onGround) {
            this.vy = jumpForce;
            this.onGround = false;
        }

        // --- FÍSICA ---
        this.vy += gravity;
        this.x += this.vx;
        this.y += this.vy;

        // --- SUELO CORRECTO ---
        const floorY = this.worldHeight - this.height;
        if (this.y >= floorY) {
            this.y = floorY;
            this.vy = 0;
            this.onGround = true;
        }

        // --- PAREDES ---
        if (this.x < 0) this.x = 0;
        if (this.x > this.worldWidth - this.width) {
            this.x = this.worldWidth - this.width;
        }
        
    }
}

module.exports = Player