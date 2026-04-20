// test-client.js
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3000');

ws.on('open', () => {
    console.log(' Conectado al servidor');
    
    // Simular un JOIN
    ws.send(JSON.stringify({ type: 'JOIN', nickname: 'JugadorTest22222' }));
    
    // Simular movimiento (presionar derecha) cada 100ms
    setInterval(() => {
        ws.send(JSON.stringify({ type: 'INPUT', left: false, right: true, jump: false }));
    }, 100);
});

ws.on('message', (data) => {
    const msg = JSON.parse(data);

    if (msg.type === 'WELCOME'){
        console.log(msg)
    }
    /*if (msg.type === 'STATE_UPDATE') {
        // Aquí verás cómo se mueven los jugadores en la consola
        console.log('Posición recibida:', msg.data.players[0].x);
    }*/
});