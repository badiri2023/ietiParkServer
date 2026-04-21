class Player {
    ///tambien tiene que tener un color 
    constructor(id, nickname, ws, startX, startY) {
        // Identificació
        this.id = id;
        this.nickname = nickname;
        this.ws = ws;
  

        // Posició (On està al món)
        this.x = startX;
        this.y = startY;

        // velocidad
        this.vx = 0; // Velocitat horitzontal
        this.vy = 0; // Velocitat vertical (gravetat)
        this.color = color;
      
        this.input = {
            left: false,
            right: false,
            jump: false
        };

        this.onGround = true; // para salto simple
    }

    // Actualización por tick
    update() {
        const speed = 5;
        const gravity = 1;
        const jumpForce = -15;

        //  Movimiento horizontal
        if (this.input.left) this.vx = -speed;
        else if (this.input.right) this.vx = speed;
        else this.vx = 0;

        // Salto (solo si está en suelo)
        if (this.input.jump && this.onGround) {
            this.vy = jumpForce;
            this.onGround = false;
        }

        //  Gravedad
        this.vy += gravity;

        //  Aplicar movimiento
        this.x += this.vx;
        this.y += this.vy;

        //  Suelo simple (sin hitbox)
        if (this.y >= 0) {
            this.y = 0;
            this.vy = 0;
            this.onGround = true;
        }
    }
}

module.exports = Player