const readline = require('readline');
const Mediador = require('./mediador.js');

const ID_CLIENTE = process.argv[2];

const FIN = "bye";
const MOSTRAR_USUARIOS = "showusers";
const ESCRIBIR_MSJ = "write";
const ESCRIBIR_EN_GRUPO = "writegroup";
const UNIRSE_GRUPO = "group";

const listaSockets = new Map();
const cacheBroker = new Map();
var reloj;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', function (comando) {
    const comandoAct = comando.split(' ');
    if (comandoAct[0] != FIN) {
        if (comandoAct[0] === MOSTRAR_USUARIOS) {

            nuevaOperacionConsola();
        }
        else
        if (comandoAct[0] === ESCRIBIR_MSJ){
            write(comandoAct);
        }
        else
        if (comandoAct[0] === ESCRIBIR_EN_GRUPO){
            console.log("ESCRIBIR EN GRUPO");
            nuevaOperacionConsola();
        }
        else
        if (comandoAct[0] === UNIRSE_GRUPO) {
            if (comandoAct.length === 2) {
                grupo(comandoAct[1]);
            }
            else {
                logearError("Cantidad invalida de argumentos");
            }
        }
        else {
            logearError("Comando erroneo... intente nuevamente");
        }
    }
    else {
        //cerrar todo socket, etc...
        rl.close();
    }
});

function logearError(mensaje) {
    console.log("\033[31m" + mensaje + "\x1b[37m")
}

function logearTexto(mensaje) {
    console.log("\x1b[33m" + mensaje + "\x1b[37m"); 
}

function nuevaOperacionConsola() {
    console.log('\x1b[33m%s\x1b[0m', "/*---------------------------------------*/");
    console.log('\x1b[33m%s\x1b[0m', "Escriba un comando para continuar...");
}

function preguntar(pregunta) {
    return new Promise((resolve, reject) => {
        rl.question(pregunta, (input) => resolve(input));
    });
}

async function write(comandoAct) {
    if (comandoAct.length === 2) {
        const topico = comandoAct[1];
        let mensaje = await preguntar("Mensaje: ");
        if (mensaje === "") {
            logearError("No se puede enviar un mensaje vacio!")
        }
        else {
            //prepararMensaje(topico, mensaje);
        }
     }
    else {
        logearError("Cantidad invalida de argumentos");
    }
    nuevaOperacionConsola();
}

function grupo(idGrupo) {

    /* const request = {
         "idPeticion": "" // este valor se setea en el mediador
         "accion": "7",
         "topico": "idGrupo",
     }
    */

    function callbackGrupo(respuesta) {
        const rtaCoord = JSON.parse(respuesta);

    }

    mediador.pedirAlCoord(request, callbackGrupo);

    nuevaOperacionConsola();
}

function enviarMensaje(broker, topico, mensaje) {
    const socket = zmq.socket('pub');
    socket.connect(`tcp://${broker.ip}:${broker.puerto}`);
    socket.send([topico, JSON.stringify(mensaje)]);
}

console.log('\x1b[33m%s\x1b[0m', "Bienvenido " + ID_CLIENTE + "!.");
nuevaOperacionConsola();