class Players {
    constructor(id, nickname) {
        // Identificació
        this.id = id;
        this.nickname = nickname;
        this.category = 'Junior'; // Valor per defecte (Punt 9 del teu projecte)

        // Posició (On està al món)
        this.x = 100;
        this.y = 100;

        // Física (Per gestionar el moviment del punt 7)
        this.vx = 0; // Velocitat horitzontal
        this.vy = 0; // Velocitat vertical (gravetat)
        this.speed = 5;

        // Dimensions (Per calcular les col·lisions del punt 10)
        this.width = 32;
        this.height = 32;
    }

    // Aquest mètode és útil per si vols resetejar el jugador
    resetPosition(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
    }
}

module.exports = Player;