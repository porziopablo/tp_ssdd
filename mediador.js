const zmq = require('zeromq');

class Mediador {

    constructor(ipCoord, puertoCoord) {
        this.ipCoord = ipCoord;
        this.puertoCoord = puertoCoord;
        this.contador = 0;
    }

    pedirAlCoord(mensaje, callback) {
        const requester = zmq.socket('req');

        requester.connect(`tcp://${this.ipCoord}:${this.puertoCoord}`);

        requester.on("message", function (reply) {
            const respuesta = JSON.parse(reply);
            callback(respuesta);
            requester.close();
        });

        mensaje.idPeticion = this.contador++;
        requester.send(JSON.stringify(mensaje));
    }

    iniciarSesion(mensaje) {

        const self = this;
        const cb = function (resolve) {
            const requester = zmq.socket('req');

            requester.connect(`tcp://${self.ipCoord}:${self.puertoCoord}`);
            requester.on("message", function (reply) {
                const respuesta = JSON.parse(reply);
                requester.close(); // si se pone despues de resolve no se ejecuta
                resolve(respuesta);
            });

            mensaje.idPeticion = self.contador++;
            requester.send(JSON.stringify(mensaje));
        }

        return new Promise(cb);
    }
}

module.exports = Mediador;