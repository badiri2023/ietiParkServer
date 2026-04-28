class Player {
    ///tambien tiene que tener un color 
    constructor(id, nickname, ws, spawnX, spawnY, color) {
        this.id = id;
        this.nickname = nickname;
        this.ws = ws;

        // POSICIÓN: Viene de los cálculos de tu Sala
        this.x = spawnX;
        this.y = spawnY;

        this.width = 112;
        this.height = 186;
 
        // PROPIEDADES
        this.vx = 0;
        this.vy = 0;
        this.color = color;
      
        this.input = { left: false, right: false, jump: false };
        this.onGround = false;
        this.completedLevel = false;
        this.worldWidth = 800;  // Ajusta según tu mapa
        this.worldHeight = 450;
        
    }
 

    setColor(color) {
        this.color = color;
    }

    // Actualización por tick
    update() {
        //SERVER: Implementació dels salts i col·lisions entre usuaris (“s’apilen” un sobre l’altre) 
        const speed = 5;
        const gravity = 0.8;  
        const jumpForce = -15;  
       
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

        const floorY = this.worldHeight - this.height;
        //suelo
        if (this.y >= floorY) {
            this.y = floorY;
            this.vy = 0;
            this.onGround = true;
        }

        // PAREDES
        if (this.x < 0) this.x = 0;
        if (this.x > this.worldWidth - this.width) {
            this.x = this.worldWidth - this.width;
        }

        this.isMoving = (this.vx !== 0);
        }
}

module.exports = Player