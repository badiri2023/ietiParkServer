// game/world.js puntos 7 y 10
class World {
    constructor() {
        this.players = {}; // Diccionari per ID
        this.doorX = 500;  // Posició de la porta (Punt 10)
        this.isDoorOpen = false;
    }

    update() {
        Object.values(this.players).forEach(p => {
            // 1. Aplicar gravetat (per al salt del punt 7)
            p.y += p.vy;
            if (p.y < 0) { p.y = 0; p.vy = 0; }

            // 2. Moure (Punt 7)
            let nextX = p.x + p.vx;

            // 3. Validar Obstacles i Jugadors (Punt 10)
            if (this.checkCollisions(p, nextX)) {
                // Si xoca, no actualitzem la X
            } else {
                p.x = nextX;
            }
        });
    }

    checkCollisions(player, nextX) {
        // Lògica per la porta
        if (!this.isDoorOpen && nextX > this.doorX) return true;

        // Lògica perquè els jugadors s'obstaculitzin (Punt 10)
        for (let other of Object.values(this.players)) {
            if (other.id !== player.id) {
                if (Math.abs(other.x - nextX) < 20) return true; // Distància mínima
            }
        }
        return false;
    }
}