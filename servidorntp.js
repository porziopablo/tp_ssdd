const net = require('net');

const port = process.argv[2]; 

const server = net.createServer(function (socket) {
    socket.on('data', function (data) {
        const request = JSON.parse(data);
        const reply = {
            t1: request.t1,
            t2: new Date().toISOString(),
            t3: new Date().toISOString()
        }
        socket.write(JSON.stringify(reply));
    });
});

server.listen(port);

server.on('listening', () => { console.log(`Server NTP escuchando en puerto: ${server.address().port}`) });

server.on('connection', function (cliente) {
    console.log(`Atendiendo a ${cliente.remoteAddress} : ${cliente.remotePort}`);
});

