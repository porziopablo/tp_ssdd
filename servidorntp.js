const net = require('net');

const port = process.argv[2]; 

var server = net.createServer(function (socket) {
    socket.on('data', function (data) {
        const request = JSON.parse(data);
        const reply = {
            "t1": request.t1,
            "t2": T2.toString(),
            "t3": T3.toString()
        }
        socket.write(JSON.stringify(reply));
    });
});

server.listen(port);

server.on('listening', () => { console.log(`Server NTP escuchando en: ${server.address().address} :  ${server.address().port}`) });

server.on('connection', function (cliente) {
    console.log(`Atendiendo a ${cliente.remoteAddress} : ${cliente.remotePort}`);
});

