// game/sala.js
class Sala {
    constructor() {
        this.players = new Map(); // Guardaremos los jugadores aquí (ID -> Datos)
    }

    // Método para añadir un jugador cuando se conecta
    addPlayer(id, nickname, socket) {
        if (this.players.size >= 8) {
            return { success: false, message: "Sala llena" };
        }
        
        this.players.set(id, {
            id: id,
            nickname: nickname,
            socket: socket, // Guardamos la conexión para hablarle
            x: 0, y: 0      // Posición inicial
        });
        
        return { success: true };
    }

    removePlayer(id) {
        this.players.delete(id);
    }

    // Preparamos la lista para enviarla al menú (Punt 4)
    getPlayerList() {
        return Array.from(this.players.values()).map(p => ({
            id: p.id,
            nickname: p.nickname
        }));
    }

    // Enviar mensaje a TODOS los conectados
    broadcast(type, data) {
        const payload = JSON.stringify({ type, data });
        this.players.forEach(player => {
            if (player.socket.readyState === 1) { // 1 = OPEN
                player.socket.send(payload);
            }
        });
    }
}

module.exports = Sala;