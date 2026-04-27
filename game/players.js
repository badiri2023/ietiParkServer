class Player {
    constructor(id, nickname, ws, spawnX, spawnY, color) {
        this.id = id;
        this.nickname = nickname;
        this.ws = ws;

        this.x = spawnX;
        this.y = spawnY;

        this.width = 40;
        this.height = 40;

        this.vx = 0;
        this.vy = 0;
        this.color = color;

        this.input = { left: false, right: false, jump: false };
        this.onGround = false;
        this.completedLevel = false;
    }

    update(floorLimit, mapWidth) {
        const speed = 5;
        const gravity = 0.8;
        const jumpForce = -15;

        if (this.input.left) this.vx = -speed;
        else if (this.input.right) this.vx = speed;
        else this.vx = 0;

        if (this.input.jump && this.onGround) {
            this.vy = jumpForce;
            this.onGround = false;
        }

        this.vy += gravity;
        this.x += this.vx;
        this.y += this.vy;

        const floorY = floorLimit - this.height;

        if (this.y >= floorY) {
            this.y = floorY;
            this.vy = 0;
            this.onGround = true;
        }

        if (this.x < 0) this.x = 0;
        if (this.x > mapWidth - this.width) this.x = mapWidth - this.width;

        this.isMoving = (this.vx !== 0);
    }
}

module.exports = Player;
