const WebSocket = require('ws');
const {MongoClient} = require('mongodb');
const Sala = require('./game/sala');


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
const sala = new Sala();
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

            const result = sala.addPlayer(myId, msg.nickname, ws);
            console.log("Resultado de addPlayer:", result);

            if (!result.success) {
                ws.send(JSON.stringify({
                    type: "ERROR",
                    message: result.message
                }));
                return;
            }
            if (!Jugadors) {
                    console.log("Mongo no listo aún");
                    return;
                }

            await Jugadors.updateOne(
                {_id: myId},
                {
                    $setOnInsert: {
                        _id: myId,
                        nickname: msg.nickname,
                        createdAt: new Date(),
                        stats: {
                            partidas: 0,
                            victorias: 0
                        }
                    }
                },
                { upsert: true }
            );
            if (!partidaActual) {
                partidaActual = {
                    _id: `partida_${Date.now()}`,
                    startedAt: new Date(),
                    players: [],
                    actions: []
                };

                await Partides.insertOne(partidaActual);
            }


            // añadir jugador a partida
            await Partides.updateOne(
                { _id: partidaActual._id },
                {
                    $push: {
                        players: {
                            playerId: myId,
                            nickname: msg.nickname
                        }
                    }
                }
            );


            
            
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
             if (partidaActual) {
                await Partides.updateOne(
                    { _id: partidaActual._id },
                    {
                        $push: {
                            actions: {
                                playerId: myId,
                                input: {
                                    left: msg.left,
                                    right: msg.right,
                                    jump: msg.jump
                                },
                                timestamp: new Date()
                            }
                        }
                    }
                );
            }
        }
    });
    //*******desconexión
    ws.on('close', () => {
        if (ws.isViewer) {
            sala.removeViewer(ws);
            return;
        }
        if (myId) {
        sala.handlePlayerDisconnect(myId);
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

async function start() {
    await connectMongo();
}
start();