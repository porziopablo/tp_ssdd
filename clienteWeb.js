const http = require('http');
const configCliente = require('./config_clienteweb.json');


const SERVER_HOST = configCliente.ipServidor;
const SERVER_PORT = configCliente.puertoServidor;
const OK = 200,OP_INV=403,PATH_NF=404;


function callBackTopicos(response){
    let respuesta;

    switch (response.statusCode) {
        case OK:
            response.on('data', (datos) => { respuesta += datos }); /* va recibiendo datos de a piezas */
            response.on('end', () => {/* ACA SE DEBERIA MODIFICAR PARA MOSTRAR LA RESPUESTA*/}); 
            break;
        case OP_INV:
            break;
        case PATH_NF:
            break;
    }
}

function callBackMensajes(response) {
    let respuesta;

    switch (response.statusCode) {
        case OK:
            response.on('data', (datos) => { respuesta += datos }); /* va recibiendo datos de a piezas */
            response.on('end', () => {/* ACA SE DEBERIA MODIFICAR PARA MOSTRAR LA RESPUESTA*/ });
            break;
        case OP_INV:
            break;
        case PATH_NF:
            break;
    }
}

function callBackElimMensajes(response) {
    let respuesta;

    switch (response.statusCode) {
        case OK:
            response.on('data', (datos) => { respuesta += datos }); /* va recibiendo datos de a piezas */
            response.on('end', () => {/* ACA SE DEBERIA MODIFICAR PARA MOSTRAR LA RESPUESTA*/ });
            break;
        case OP_INV:
            break;
        case PATH_NF:
            break;
    }
}

/* MOSTRAR TOPICOS DEL BROKER */
function mostrarTopicos(idBroker)
{
    http.get(`http://${SERVER_HOST}:${SERVER_PORT}/broker/${idBroker}/topics`, callBackTopicos);
}

/* MOSTRAR MENSAJES DE UN TOPICO DE UN BROKER */
function mostrarMensajes(idBroker, topico) {
    http.get(`http://${SERVER_HOST}:${SERVER_PORT}/broker/${idBroker}/topics/${topico}`, callBackMensajes);
}

/* BORRAR MENSAJES DE UN TOPICO DE UN BROKER */
function eliminarMensajes(idBroker, topico) {
    const options = {
        hostname: SERVER_HOST,
        port: SERVER_PORT,
        path: `/broker/${idBroker}/topics/${topico}`,
        method: 'DELETE',
    }

    const req = http.request(options, callBackElimMensajes);

    req.end();
}