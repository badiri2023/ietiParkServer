const WebSocket = require('ws');
const Sala = require('./game/sala');

const wss = new WebSocket.Server({ port: 3000 });
const sala = new Sala();

console.log("Servidor en ws://localhost:3000");

wss.on('connection', (ws) => {
    console.log("Conexió feta");

    let myId = null;

    ws.on('message', (message) => {
        let msg;

        // vitar crash por JSON inválido
        try {
            msg = JSON.parse(message);
        } catch {
            console.log(" JSON inválido");
            return;
        }
        // JOIN
      
        if (msg.type === "JOIN") {
            myId = Math.random().toString(36).substring(2, 10);

            const result = sala.addPlayer(myId, msg.nickname, ws);

            if (!result.success) {
                ws.send(JSON.stringify({
                    type: "ERROR",
                    message: result.message
                }));
                return;
            }

            console.log(`${msg.nickname} unido`);

            ws.send(JSON.stringify({
                type: "WELCOME",
                id: myId
            }));

            sala.broadcast("PLAYER_LIST", sala.getPlayerList());
        }


        // INPUT
        if (msg.type === "INPUT") {
            const player = sala.getPlayer(myId);
            if (!player) return;

            //  actualizar inputs
            player.input.left = msg.left;
            player.input.right = msg.right;
            player.input.jump = msg.jump;
        }
    });

    ws.on('close', () => {
        if (myId) {
            sala.removePlayer(myId);

            sala.broadcast("PLAYER_LIST", sala.getPlayerList());

            console.log(`Jugador ${nickname} desconectado`);
        }
    });
});