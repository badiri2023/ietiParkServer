class Player {
    ///tambien tiene que tener un color 
    constructor(id, nickname, ws, startX, startY, color) {
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
        const gravity = -0.8;  // Negativo para que tire hacia abajo la gravedad
        const jumpForce = 15;  // Positivo para que salte hacia arriba el pj
        const playerWidth = 40;
        const playerHeight = 40;

        // 1. Movimiento horizontal
        if (this.input.left) this.vx = -speed;
        else if (this.input.right) this.vx = speed;
        else this.vx = 0;

        // 2. Salto (solo si está en el suelo)
        if (this.input.jump && this.onGround) {
            this.vy = jumpForce; 
            this.onGround = false;
        }

        // 3. Aplicar físicas
        this.vy += gravity;
        this.x += this.vx;
        this.y += this.vy;

        // --- LÍMITES DEL MAPA (700x500) ---
        // Suelo (Y = 0)
        if (this.y < 0) {
            this.y = 0;
            this.vy = 0;
            this.onGround = true;
        }
        // Paredes (X)
        if (this.x < 0) this.x = 0;
        if (this.x > 700 - playerWidth) this.x = 700 - playerWidth;

        // Guardar si se está moviendo para la animación
        this.isMoving = (this.vx !== 0);
    }
}

module.exports = Player