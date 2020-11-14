const readline = require('readline');
const Mediador = require('./mediador.js');
const AlmacenMensajes = require('./almacenMensajes.js');

const ID_CLIENTE = process.argv[2];

const FIN = "bye";
const MOSTRAR_USUARIOS = "showusers";
const ESCRIBIR_MSJ = "write";
const ESCRIBIR_EN_GRUPO = "writegroup";
const UNIRSE_GRUPO = "group";


const TOPICO_ALL = "message/all";


const listaSockets = new Map(); //estos new no deberian ir adentro de arranque?
const cacheBroker = new Map();
var reloj;
var almacenMensajes;


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', function (comando) {
    const comandoAct = comando.split(' ');
    if (comandoAct[0] != FIN) {
        if (comandoAct[0] === MOSTRAR_USUARIOS) {
            //???????????
            nuevaOperacionConsola();
        }
        else
        if (comandoAct[0] === ESCRIBIR_MSJ){
            write(comandoAct);
        }
        else
        if (comandoAct[0] === ESCRIBIR_EN_GRUPO){
            //parte de ivan
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
            prepararMensaje(topico, mensaje);
        }
     }
    else {
        logearError("Cantidad invalida de argumentos");
    }
    nuevaOperacionConsola();
}

function grupo(idGrupo) {
    const request = {
         "idPeticion": "", // este valor se setea en el mediador
         "accion": "7",
         "topico": "message/"+idGrupo,
    }

    function callbackGrupo(rtaCoord) {
        if (rtaCoord.grupoNuevo == true) {
            logearTexto("El grupo se ha creado correctamente!"); //que pasa si tiro error?
        }
        else {
            logearTexto("Se lo ha agregado al grupo correctamente!");
        }

        const brokerGrupo = rtaCoord.resultados.datosBroker[0];
        cacheBroker.set(idGrupo, { ip: brokerGrupo.ip, puerto: brokerGrupo.puerto });

        const socket = zmq.socket('sub');
        socket.connect(`tcp://${brokerGrupo.ip}:${brokerGrupo.puerto}`);
        socket.on("message", recibirMensaje);
        listaSockets.set(idGrupo, socket); // agrego el socket a la lista de grupos
    }

    logearTexto("Solicitando operacion...");
    Mediador.pedirAlCoord(request, callbackGrupo);
    nuevaOperacionConsola();
}

function enviarMensaje(broker, topico, mensaje) {
    const socket = zmq.socket('pub');
    socket.connect(`tcp://${broker.ip}:${broker.puerto}`);
    socket.send([topico, JSON.stringify(mensaje)]);
}

function parseIDdeTopico(topico) { //ojo que esto hace que no se pueda poner una barra en el id del cliente
    const res = topico.split("/");
    return res[1];
}

function prepararMensaje(topico, stringMensaje) {
    const horaAct = reloj.solicitarTiempo();
    const objMensaje = {
        "emisor": ID_CLIENTE,
        "mensaje": stringMensaje,
        "fecha": horaAct.toISOString()
    }
    if (topico === TOPICO_ALL) {
        enviarMensaje(cacheBroker.get("all"), topico, objMensaje); //habria que ver si ya esta en la cache?
    }
    else {
        if (cacheBroker.has(parseIDdeTopico(topico))) {
            enviarMensaje(cacheBroker.get(parseIDdeTopico(topico)), topico, objMensaje); 
        }
        else {
            const request = {
                "idPeticion": "", // este valor se setea en el mediador
                "accion": "1",
                "topico": topico,
            }

            function callback(respuesta)  // la respuesta es la del formato oficial 
            {
                const rtaCoord = JSON.parse(respuesta);
                cacheBroker.set(parseIDdeTopico(rtaCoord.resultados.topico), {
                    "ip": rtaCoord.resultados.ip,
                    "puerto": rtaCoord.resultados.puerto
                }); 
                enviarMensaje(cacheBroker.get(topico), topico, objMensaje);
            }

            mediador.pedirAlCoord(request, callback);
        }
    }

}  

function recibirMensaje(topico, mensaje){
    almacenMensajes.almacenarMensaje(topico, mensaje);
    logearTexto("[" + topico + " | " + mensaje.emisor + " | " + mensaje.fecha + " | " + mensaje.mensaje + "]"); //quiza convenga recortar un poco la fecha
}

//esto deberia ir en arranque creo:
console.log('\x1b[33m%s\x1b[0m', "Bienvenido " + ID_CLIENTE + "!.");
nuevaOperacionConsola();