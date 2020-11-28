const AlmacenBroker = require('./almacenBroker.js');
const configCoord = require('./config_coord.json');

const zmq = require('zeromq');

const responder = zmq.socket('rep');
var almacenBroker;

const PEDIDO_PUB = 1;
const NUEVA_ALTA = 2;
const PUB = 'PUB';
const SUB = 'SUB';
const TOPICO_HB = "heartbeat";
const TOPICO_ALL = "message/all";
const PREFIJO_TOPICO = "message/";
const TOP_INEXISTENTE = 1, OP_INEXISTENTE = 2; /* CODIGOS DE ERROR */


function arranque() {
    almacenBroker = new AlmacenBroker(configCoord.datosBroker);
    responder.bind('tcp://*:' + configCoord.puertoClientes);
    responder.on('message', atencionAlCliente);
    console.log('Coordinador atendiendo en puerto: ', configCoord.puertoClientes);
    console.log('Usando configuracion: ', configCoord);
}

function Respuesta(exito, accion, idPeticion, resultados, error) {
    this.exito = exito;
    this.accion = accion;
    this.idPeticion = idPeticion;
    this.resultados = resultados;
    this.error = error;
}

async function atencionAlCliente(solicitudJSON){
    const solicitud = JSON.parse(solicitudJSON);
    let resultados = {}, error = {};
    let exito = true;
    switch (parseInt(solicitud.accion)) {
        case PEDIDO_PUB:
            const broker = await obtenerBroker(solicitud.topico, SUB); //pido el de suscripcion del broker
            resultados = {
                "datosBroker": [broker]
            };
            break;
        case NUEVA_ALTA:
            const brokerAll = await obtenerBroker(TOPICO_ALL, PUB);//pido el de publicacion del broker
            const brokerHB = await obtenerBroker(TOPICO_HB, PUB);//pido el de publicacion del broker
            const brokerCli = await obtenerBroker(solicitud.topico, PUB);//pido el de publicacion del broker
            resultados = {
                "datosBroker": [brokerAll, brokerHB, brokerCli]
            };
            break;
        default:
            exito = false; error = nuevoError(OP_INEXISTENTE);
            break;
    }
    responder.send(JSON.stringify(new Respuesta(exito, solicitud.accion, solicitud.idPeticion, resultados, error)));
}

async function obtenerBroker(topico, tipo) {
    let broker = null;
    broker = almacenBroker.buscarBroker(topico,tipo);
    if (!broker) {
        broker = almacenBroker.pedirBroker(topico, tipo);
        let respondioBien = false
        while(!respondioBien) {
            const respuesta = await informarBroker(topico, broker.ip, broker.puertoRep);
            respondioBien = respuesta.exito
        }
    }
    return broker;
} 

function nuevoError(codigo) {
    let descripcion = "";
    switch (codigo) {
        case TOP_INEXISTENTE:
            descripcion = "topico inexistente"; break;
        case OP_INEXISTENTE:
            descripcion = "operacion inexistente"; break;
    }
    return { codigo: codigo, descripcion: descripcion };
}

function informarBroker(topico, ipBroker, puertoRepBroker) {
    const cb = function (resolve) {
        const requester = zmq.socket('req');
        requester.connect(`tcp://${ipBroker}:${puertoRepBroker}`);
        requester.on("message", function (reply) {
            const respuesta = JSON.parse(reply);
            requester.close(); // si se pone despues de resolve no se ejecuta 
            resolve(respuesta);
        });
        const mensaje = {
            "idPeticion": "",
            "accion": "3",
            "topico": topico,
        }  
        requester.send(JSON.stringify(mensaje));
    }
    return new Promise(cb);
}

arranque();