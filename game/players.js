class Player {
    ///tambien tiene que tener un color 
    constructor(id, nickname, ws, spawnX, spawnY, color, world) {
        this.id = id;
        this.nickname = nickname;
        this.ws = ws;
        this.world = world;

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
        this.falling = false;
        this.fallTimer = 0;
    }

    // colisión AABB
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y;
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
            return;
        }

        //SERVER: Implementació dels salts i col·lisions entre usuaris (“s’apilen” un sobre l’altre) 
        const speed = 10;
        const gravity = 0.8;
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

        // =========================
        // MOVIMIENTO X + COLISION
        // =========================
        this.x += this.vx;

        for (const obs of this.world.obstacles) {
            if (this.checkCollision(this, obs)) {
                if (this.vx > 0) {
                    this.x = obs.x - this.width;
                } else if (this.vx < 0) {
                    this.x = obs.x + obs.width;
                }
                this.vx = 0;
            }
        }

        // =========================
        // MOVIMIENTO Y + COLISION
        // =========================
        this.y += this.vy;
        this.onGround = false;

        for (const obs of this.world.obstacles) {
            if (this.checkCollision(this, obs)) {

                if (this.vy > 0) {
                    // cayendo encima del suelo
                    this.y = obs.y - this.height;
                    this.onGround = true;
                } else if (this.vy < 0) {
                    // chocando con techo
                    this.y = obs.y + obs.height;
                }

                this.vy = 0;
            }
        }

        // =========================
        // LIMITES DEL MUNDO
        // =========================
        if (this.x < 0) this.x = 0;

        if (this.x > this.world.width - this.width) {
            this.x = this.world.width - this.width;
        }

        if (this.y > this.world.height) {
            this.y = this.world.height - this.height;
            this.vy = 0;
            this.onGround = true;
        }

        // FIX IMPORTANTE: seguridad extra
        if (this.y < -500) {
            this.y = 0;
            this.vy = 0;
        }
    }
}

module.exports = Player;