// server.js
const WebSocket = require('ws');
const Sala = require('./game/sala');

const wss = new WebSocket.Server({ port: 3000 });
const partida = new Sala();

console.log("Servidor iniciado en puerto 3000...");

wss.on('connection', (ws) => {
    console.log('client conectat')
    let myId = null;
    //recibimos mensajes del cliente
    ws.on('message', (message) => {
        const msg = JSON.parse(message);

        // Cuando el cliente se presenta (Punt 4: Pantalla de inicio)
        if (msg.type === 'JOIN') {
            myId = Date.now().toString(); // ID único
            const result = partida.addPlayer(myId, msg.nickname, ws);
            
            if (result.success) {
                console.log(`Jugador unido: ${msg.nickname}`);
                // Avisamos a todos los clientes que hay un nuevo jugador
                partida.broadcast('PLAYER_LIST', partida.getPlayerList());
            } else {
                ws.send(JSON.stringify({ type: 'ERROR', message: result.message }));
            }
        }
    });

    ws.on('close', () => {
        if (myId) {
            partida.removePlayer(myId);
            partida.broadcast('PLAYER_LIST', partida.getPlayerList());
            console.log("Jugador desconectado");
        }
    });
});