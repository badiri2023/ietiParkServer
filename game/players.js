class Player {
    ///tambien tiene que tener un color 
    constructor(id, nickname, ws, startX, startY, color) {
        // Identificació
        this.id = id;
        this.nickname = nickname;
        this.ws = ws;
        // Posició (On està al món)
        const floorY = 500 - 40; // 40 es el playerHeight
        this.y = (startY !== undefined && startY > 0) ? startY : floorY;
        this.x = startX;
 

        // velocidad
        this.vx = 0; // Velocitat horitzontal
        this.vy = 0; // Velocitat vertical (gravetat)
        this.color = color;
      
        this.input = {
            left: false,
            right: false,
            jump: false
        };

        this.onGround = false; // para salto simple
        this.completedLevel = false; //para pasar a segunda pantalla
    }

    // Actualización por tick
    update() {
        const speed = 5;
        const gravity = 0.8;  
        const jumpForce = -15;  
        const playerWidth = 40;
        const playerHeight = 40;

        // Movimiento horizontal
        if (this.input.left) this.vx = -speed;
        else if (this.input.right) this.vx = speed;
        else this.vx = 0;

        //  Salto 
        if (this.input.jump && this.onGround) {
            this.vy = jumpForce; 
            this.onGround = false;
        }

        // Aplicar físicas
        this.vy += gravity;
        this.x += this.vx;
        this.y += this.vy;

        // --- LÍMITES DEL MAPA (700x500) ---

          const floorY = 500 - playerHeight;
        //suelo
        if (this.y >= floorY) {
            this.y = floorY;
            this.vy = 0;
            this.onGround = true;
        }

        // PAREDES
        if (this.x < 0) this.x = 0;
        if (this.x > 700 - playerWidth) this.x = 700 - playerWidth;

        this.isMoving = (this.vx !== 0);
    }
}

module.exports = Player