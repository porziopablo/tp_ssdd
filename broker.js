const zmq = require('zeromq');

const OK = 0, TOP_INEXISTENTE = 1, OP_INEXISTENTE = 2; /* CODIGOS DE ERROR */
const HEARTBEAT = "heartbeat"; /* TOPICOS */
const NUEVO_TOP = 3, MOSTRAR_TOP = 4, MOSTRAR_MSJ = 5, BORRAR_MSJ = 6; /* OPERACIONES */

const subSocket = zmq.socket('xsub'), pubSocket = zmq.socket('xpub'), responder = zmq.socket('rep');
const colaMensajes = new Map();

// SOLO PARA TESTEAR
subSocket.bindSync('tcp://127.0.0.1:3000');
pubSocket.bindSync('tcp://127.0.0.1:3001');
responder.bind('tcp://*:5555');
// BORRAR LO DE BIND

/* METODOS INTERFAZ A: BROKER <==> CLIENTE */

function almacenarMensaje(topico, mensaje) {
    colaMensajes.get(topico).add(mensaje);
}

subSocket.on('message', function (topico, mensaje) {
    const topicoString = topico.toString();

    console.log(`Mensaje recibido: Topico: ${topicoString} - Mensaje: `, JSON.parse(mensaje));
    if (colaMensajes.has(topicoString)) {
        if (topicoString != HEARTBEAT)
            almacenarMensaje(topicoString, JSON.parse(mensaje));
        pubSocket.send([topico, mensaje]);
    }
})

/* METODOS INTERFAZ B: BROKER <==> COORDINADOR/SERVIDOR HTTP */

function nuevoTopico(topico) {
    colaMensajes.set(topico, new Set());
    subSocket.send(String.fromCharCode(1) + topico); /* se suscribe al nuevo tópico, usa ASCII = 1 adelante porque lo requiere ZMQ */   

    return { code: OK };
}

function mostrarTopicos() {
    return { listaTopicos: Array.from(colaMensajes.keys()) };
}

function mostrarMensajes(topico) {
    let mensajes = [];

    if (colaMensajes.has(topico)) {
        mensajes = Array.from(colaMensajes.get(topico).values());
    }

    return { mensajes: mensajes };
}

function borrarMensajes(topico) {
    let respuesta;

    if (colaMensajes.has(topico)) {
        colaMensajes.get(topico).clear();
        respuesta = { code: OK };
    }
    else
        respuesta = { code: TOP_INEXISTENTE };

    return respuesta;
}

responder.on('message', function (request) {
    const solicitud = JSON.parse(request);
    let respuesta;
    
    switch (solicitud.accion) {
        case NUEVO_TOP:
            respuesta = nuevoTopico(solicitud.topico); break;
        case MOSTRAR_TOP:
            respuesta = mostrarTopicos(); break;
        case MOSTRAR_MSJ:
            respuesta = mostrarMensajes(solicitud.topico); break;
        case BORRAR_MSJ:
            respuesta = borrarMensajes(solicitud.topico); break;
        default:
            respuesta = { code: OP_INEXISTENTE };
    }
        
    responder.send(JSON.stringify(respuesta));
});