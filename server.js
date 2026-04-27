const WebSocket = require('ws');
const Sala = require('./game/sala');

//const wss = new WebSocket.Server({ port: 3000 });
const wss = new WebSocket.Server({ port: 3000, host: '0.0.0.0' });

const sala = new Sala();

console.log("Servidor en ws://0.0.0.0:3000");

wss.on('connection', (ws) => {
    console.log("Conexió feta");

    let myId = null;
    ws.isViewer = false;



    ws.on('message', (message) => {
        let msg;

        // vitar crash por JSON inválido
        try {
            msg = JSON.parse(message);
        } catch {
            console.log(" JSON inválido");
            return;
        }

        //Fluter observador
        if (msg.type === "JOIN_VIEWER") {
            ws.isViewer = true;
            console.log("Observador  conectado");
            sala.viewers.add(ws);
            ws.send(JSON.stringify({
                type: "WORLD_INIT",
                data: sala.getWorldData() 
            }));

            //estado inicial
            ws.send(JSON.stringify({
                type: "STATE_UPDATE",
                data: sala.getState()
            }));

            return;
        }

        // Player JOIN
      
        if (msg.type === "JOIN") {
            myId = Math.random().toString(36).substring(2, 10);

            const result = sala.addPlayer(myId, msg.nickname, ws);
            console.log("Resultado de addPlayer:", result);

            if (!result.success) {
                ws.send(JSON.stringify({
                    type: "ERROR",
                    message: result.message
                }));
                return;
            }
            
            ws.send(JSON.stringify({
                type: "WELCOME",
                id: myId,
                nickname: msg.nickname //recordar a Bad que cambie que reciba  un name
            }));
            sala.broadcast("PLAYER_LIST", sala.getPlayerList());
            console.log(`${msg.nickname} unido`);
            return;
            
        }


        // INPUT
        if (msg.type === "INPUT") {
            const player = sala.getPlayer(myId);
            if (!player) return;

            //  actualizar inputs
            player.input.left = msg.left;
            player.input.right = msg.right;
            player.input.jump = msg.jump;
            //console.log(`[INPUT] Jugador ${player.nickname} -> Izquierda: ${msg.left} | Derecha: ${msg.right} | Salto: ${msg.jump}`);
        }
    });
    //*******desconexión
    ws.on('close', () => {
        if (ws.isViewer) {
            sala.removeViewer(ws);
            return;
        }
        if (myId) {
            const player = sala.getPlayer(myId);
            const nickName = player ? player.nickname : "Desconocido";
            sala.removePlayer(myId);
            sala.broadcast("PLAYER_LEFT", {
            id: myId,
            nickname: nickName
        });

            sala.broadcast("PLAYER_LIST", sala.getPlayerList());

            console.log(`Jugador ${nickName} desconectado`);
        }
    });
     ws.on('error', (err) => {
        console.log("Error en conexión:", err.message);
    });
});