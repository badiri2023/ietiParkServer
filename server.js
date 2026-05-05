const WebSocket = require('ws');
const {MongoClient} = require('mongodb');
const Sala = require('./game/sala');
let partidaNumero = 0;

///---------------config Mongo
//const uri = 'mongodb://root:password@localhost:27017/';
const uri ='mongodb://localhost:27017/pico4_db'
const client = new MongoClient(uri);

let db;
let Jugadors;
let Nivells;
let Partides;
let Records;

///--------------estado servidor
//const sala = new Sala();
let sala;
let ready = false;
//const wss = new WebSocket.Server({ port: 3000 });
const wss = new WebSocket.Server({ port: 3000, host: '0.0.0.0' });
console.log("Servidor en ws://0.0.0.0:3000");


///-----------conexion mongo
async function connectMongo() {
    await client.connect();

    db = client.db('pico4_db');

    // Colecciones 
    Jugadors = db.collection('jugadors');
    //Nivells = db.collection('nivells');
    Partides = db.collection('partides');
    Records = db.collection('records');

    console.log("MongoDB conectado");

}
async function start() {
    await connectMongo();

    sala = new Sala(Partides);
    ready = true;

    //console.log("Servidor listo");
}
start();


let partidaActual = null;//estado partida


/////-------Websocket server
wss.on('connection', (ws) => {
    console.log("Cliente conectado ");

    let myId = null;
    ws.isViewer = false;

    ws.on('message', async (message) => {
        let msg;
        // evitar crash por JSON inválido
        try {
            msg = JSON.parse(message);
        } catch {
            console.log(" JSON inválido");
            return;
        }

         //****Fluter observador
        if (msg.type === "JOIN_VIEWER") {
            ws.isViewer = true;
            sala.addViewer(ws);
            return;
        }

        // ****Player JOIN
        if (msg.type === "JOIN") {
            myId = Math.random().toString(36).substring(2, 10);

            const result = await sala.addPlayer(myId, msg.nickname, ws);
            //console.log("Resultado de addPlayer:", result);

            if (!result.success) {
                ws.send(JSON.stringify({
                    type: "ERROR",
                    message: result.message
                }));
                return;
            }
            const playerActual = sala.getPlayer(myId);

            if (Jugadors) {
                try {
                    await Jugadors.updateOne(
                        { nickname: msg.nickname }, 
                        {
                            $set: { 
                                playerId: myId,   
                                color: playerActual.color
                            }
                        },
                        { upsert: true } // Si no existe, lo crea. Si existe, lo actualiza.
                    );
                } catch (err) {
                    console.error("Error guardando jugador en Mongo:", err);
                }
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
           // console.log(`[INPUT] Jugador ${player.nickname} -> Izquierda: ${msg.left} | Derecha: ${msg.right} | Salto: ${msg.jump}`);
        }
    });
    //*******desconexión
    ws.on('close', () => {
        if (ws.isViewer) {
            sala.removeViewer(ws);
            return;
        }
        if (myId) {
        sala.removePlayer(myId);
        }
       /* if (myId) {
            const player = sala.getPlayer(myId);
            const nickName = player ? player.nickname : "Desconocido";
            sala.removePlayer(myId);
            sala.broadcast("PLAYER_LEFT", {
            id: myId,
            nickname: nickName
        });

            sala.broadcast("PLAYER_LIST", sala.getPlayerList());

            console.log(`Jugador ${nickName} desconectado`);*/
    });
     ws.on('error', (err) => {
        console.log("Error en conexión:", err.message);
    });
});

