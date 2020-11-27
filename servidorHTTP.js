const http = require('http');
const zmq = require('zeromq');
const url = require('url');
const config = require('./config_http.json');

const MOSTRAR_TOP = 4, MOSTRAR_MSJ = 5, BORRAR_MSJ = 6;

const brokers = new Map();
let server;

function rutaValida(ruta, metodo) {
    let respuesta = false;

    if ((metodo == 'DELETE' && (ruta.length == 4 || ruta.length == 5)) ||
        (metodo == 'GET' && ruta.length >= 3 && ruta.length <= 5)) {

        if (ruta[0] == 'broker' && ruta[2] == 'topics') {
            respuesta = brokers.has(ruta[1]);
        }
    }

    return respuesta;
}

function solicitarAlBroker(broker, operacion, topico) {

    const cb = function (resolve) {

        const requester = zmq.socket('req');

        requester.connect(`tcp://${broker.ip}:${broker.puerto}`);

        requester.on("message", function (reply) {

            const respuestaB = JSON.parse(reply);
            const respuestaD = {exito: respuestaB.exito, resultados: respuestaB.resultados, error: respuestaB.error}; 

            requester.close(); // si se pone despues de resolve no se ejecuta 
            resolve(JSON.stringify(respuestaD));
        });

        const mensaje = { idPeticion: 0, accion: operacion, topico: topico };

        requester.send(JSON.stringify(mensaje));
    }

    return new Promise(cb);
} 

async function atencionAlCliente(solicitud, respuesta) {
    const ruta = url.parse(solicitud.url).pathname.split('/');
    let topico = "topico";

    ruta.shift(); // para quitar el primer resultado que es un "" antes de la primer /

    respuesta.setHeader("Content-Type", "application/json");

    if (solicitud.method == 'GET' || solicitud.method == 'DELETE') {
        if (rutaValida(ruta, solicitud.method)) {

            if (ruta.length == 4)
                topico = ruta[3]; //heartbeat
            else
                if (ruta.length == 5)
                    topico = ruta[3] + "/" + ruta[4];  // messsage/algo

            if (solicitud.method == 'GET')
                if (ruta.length == 3)           // operacion D1 = B4
                    resultado = await solicitarAlBroker(brokers.get(ruta[1]), MOSTRAR_TOP, topico);
                else                            // operacion D2 = B5
                    resultado = await solicitarAlBroker(brokers.get(ruta[1]), MOSTRAR_MSJ, topico);
            else                                // operacion D3 = B6
                resultado = await solicitarAlBroker(brokers.get(ruta[1]), BORRAR_MSJ, topico);

            respuesta.writeHead(200);
            respuesta.end(resultado);
        }
        else {
            respuesta.writeHead(404); /* path no reconocido */
            respuesta.end("error");
        }
    }
    else {
        respuesta.writeHead(403); /* metodo HTTP !== GET o DELETE */
        respuesta.end("error");
    }
}

function arranque() {
    config.datosBroker.forEach((broker) => { brokers.set(broker.id, { ip: broker.ip, puerto: broker.puerto }) });

    server = http.createServer(atencionAlCliente);

    server.listen(config.puertoServidor, () => { console.log(`Servidor HTTP atendiendo en puerto ${config.puertoServidor}`) });
}

arranque();