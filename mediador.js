const zmq = require(zeromq);

class Mediador {

    constructor(ipCoord, puertoCoord) {
        this.ipCoord = ipCoord;
        this.puertoCoord = puertoCoord;
        this.contador = 0;
    }

    pedirAlCoord(mensaje, callback) {

        const requester = zmq.socket('req');
        requester.connect("tcp://this.ipCoord:this.puertoCoord");
        requester.on("message", function (reply) {
            respuesta = JSON.parse(reply);
            callback(respuesta);
            requester.close(); //probar aca o sino antes del callback
        })

        mensaje.idPeticion = this.contador++ //posincremento 
        requester.send(JSON.stringify(mensaje)); 
    } 

    iniciarSesion(mensaje) {

        const cb = function (resolve) {

            const requester = zmq.socket('req');
            requester.connect("tcp://this.ipCoord:this.puertoCoord");
            requester.on("message", function (reply) {
                respuesta = JSON.parse(reply);
                resolve(respuesta);
                requester.close();

            });

            Mensaje.idPeticion = this.contador++ //posincremento 
            requester.send(JSON.stringify(mensaje));

        }

        return new Promise(cb);

    }

} 

module.exports = Mediador

