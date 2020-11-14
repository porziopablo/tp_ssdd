const Reloj = require('./reloj.js');
const ColaMensajes = require('./colaMensajes.js');
const zmq = require('zeromq');
const ListaConectados = require('./listaConectados.js');
const configBroker = require('./config_broker.json');

const TOP_INEXISTENTE = 1, OP_INEXISTENTE = 2; /* CODIGOS DE ERROR */
const HEARTBEAT = "heartbeat", ALL = "message/all", PREFIJO = "message/"; /* TOPICOS */
const NUEVO_TOP = 3, MOSTRAR_TOP = 4, MOSTRAR_MSJ = 5, BORRAR_MSJ = 6; /* OPERACIONES */

const subSocket = zmq.socket('xsub'), pubSocket = zmq.socket('xpub'), responder = zmq.socket('rep');

const BROKER_ID = process.argv[2];
let reloj;
let colaMensajes;

/* INICIO */

function arranque() {

    console.log(`Arrancando broker con ID = ${BROKER_ID}...`);
    console.log("Usando configuracion: ", configBroker);


    reloj = new Reloj(configBroker.ipNTP, configBroker.puertoNTP, configBroker.periodoReloj);  //CREO INSTANCIA DE RELOJ
    colaMensajes = new ColaMensajes(configBroker.periodoCola, configBroker.tamMaxCola, configBroker.plazoMaxCola, reloj);
    listaConectados = new ListaConectados(reloj, configBroker.plazoMaxHeart, configBroker.periodoListaHeart);

    responder.bind('tcp://*:' + configBroker.puertoREP);
    subSocket.bindSync('tcp://*:' + configBroker.puertoSUB);
    pubSocket.bindSync('tcp://*:' + configBroker.puertoPUB);

    subSocket.send(String.fromCharCode(1) + HEARTBEAT); // se suscribe a heartbeat
}

/* METODO INTERFAZ A: BROKER <==> CLIENTE */

function enviarMensajesAnteriores(topicoMsj, topicoCliente) {
    const mensajes = colaMensajes.obtenerMensajes(topicoMsj);

    console.log(`Poniendo al dia a: ${topicoCliente} con ${topicoMsj}`);

    mensajes.forEach((msj) => { pubSocket.send([topicoCliente, JSON.stringify(msj)]) });
}

subSocket.on('message', function (topicoBytes, mensaje) {
    const topico = topicoBytes.toString();
    let heartbeat = {}, topicoCliente = "";

    console.log(`Mensaje recibido: Topico: ${topico} - Mensaje: `, JSON.parse(mensaje));

    if (topico != HEARTBEAT) {
        if (colaMensajes.almacenarMensaje(topico, JSON.parse(mensaje)))
            pubSocket.send([topico, mensaje]);
        else
            console.log("Mensaje descartado");
    }
    else {
        heartbeat = JSON.parse(mensaje);
        topicoCliente = PREFIJO + heartbeat.emisor;
        if (listaConectados.actualizarHeartbeat(heartbeat)) {   // es alguien recien conectado

            if (colaMensajes.responsableTopico(ALL))           // el broker lo pone al tanto si es responsable de ALL
                enviarMensajesAnteriores(ALL, topicoCliente);

            if (colaMensajes.responsableTopico(topicoCliente)) // el broker lo pone al tanto si es responsable de su topico
                enviarMensajesAnteriores(topicoCliente, topicoCliente);
        }
        if (colaMensajes.responsableTopico(HEARTBEAT)) //si el broker es responsable de HEARTBEAT, publica el msj
            pubSocket.send([topico, mensaje]);
    }
})

/* METODOS INTERFAZ B: BROKER <==> COORDINADOR/SERVIDOR HTTP */

function nuevoTopico(topico) {
    colaMensajes.nuevoTopico(topico);
    subSocket.send(String.fromCharCode(1) + topico);
    /* se suscribe al nuevo tópico, usa ASCII = 1 adelante porque lo requiere ZMQ */
}

function Respuesta(exito, accion, idPeticion, resultados, error) {
    this.exito = exito;
    this.accion = accion;
    this.idPeticion = idPeticion;
    this.resultados = resultados;
    this.error = error;
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

responder.on('message', function (solicitudJSON) {
    const solicitud = JSON.parse(solicitudJSON);
    let resultados = {}, error = {};
    let exito = true;
    
    switch (parseInt(solicitud.accion)) {
        case NUEVO_TOP:
            nuevoTopico(solicitud.topico); break;
        case MOSTRAR_TOP:
            resultados = { listaTopicos: colaMensajes.obtenerTopicos() }; break;
        case MOSTRAR_MSJ:
            if (colaMensajes.responsableTopico(solicitud.topico)) {
                resultados = { mensajes: colaMensajes.obtenerMensajes(solicitud.topico) };
            }
            else {
                exito = false;
                error = nuevoError(TOP_INEXISTENTE);
                resultados = { mensajes: [] };
            }
            break;
        case BORRAR_MSJ:
            exito = colaMensajes.borrarMensajes(solicitud.topico);
            if (!exito)
                error = nuevoError(TOP_INEXISTENTE);
            break;
        default:
            exito = false; error = nuevoError(OP_INEXISTENTE);
    }
        
    responder.send(JSON.stringify(new Respuesta(exito, solicitud.accion, solicitud.idPeticion, resultados, error)));
});

arranque();