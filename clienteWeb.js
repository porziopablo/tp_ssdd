const http = require('http');

const SERVER_HOST = '192.168.0.9';
const SERVER_PORT = 80;
const OK = 200;

const mostrar = function (response) {
    let respuesta = '';

    if (response.statusCode == OK) {
        response.on('data', (datos) => { respuesta += datos }); /* va recibiendo datos de a piezas */
        response.on('end', () => { console.log('Resultado: ', JSON.parse(respuesta)) }); 
    }
    else {
        response.resume(); //para liberar buffer
        console.log('Error al contactar servidor: ', response.statusCode);
    }
};

/* MOSTRAR TOPICOS DEL BROKER */
http.get(`http://${SERVER_HOST}:${SERVER_PORT}/broker/BROKER_1/topics`, mostrar);

/* MOSTRAR MENSAJES DE UN TOPICO DE UN BROKER */
http.get(`http://${SERVER_HOST}:${SERVER_PORT}/broker/BROKER_1/topics/message/all`, mostrar);

/* BORRAR MENSAJES DE UN TOPICO DE UN BROKER */
const options = {
    hostname: SERVER_HOST,
    port: SERVER_PORT,
    path: '/broker/BROKER_1/topics/message/all',
    method: 'DELETE',
}

const req = http.request(options, mostrar);

req.end();