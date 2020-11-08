const net = require('net');

class Reloj {
    constructor(ip, puerto, periodo) {
        this.ip = ip;
        this.puerto = puerto;
        this.periodo = periodo;
        this.offset = 0;
    }

    get ip() {
        return this.ip;
    }

    get puerto() {
        return this.puerto;
    }

    get periodo() {
        return this.periodo;
    }

    get offset() {
        return this.offset;
    }

    solicitarTiempo() {
        const tAct = (new Date()).getTime() + this.offset;
        return tAct;
    }

    actualizarTiempo() {
        var funcionIntervalo = setInterval(function () {

            const client = new net.Socket();

            client.connect(SERVER_PORT, SERVER_IP, function () {
                const T1 = (new Date()).getTime().toString();  /* tiempo de env�o del cliente */
                client.write(T1);
            });

            client.on('data', function (respuesta) {
                const T4 = (new Date()).getTime(); /* tiempo de arribo de respuesta del servidor */
                const tiempos = respuesta.toString().split(',');

                const T1 = parseInt(tiempos[0]);
                const T2 = parseInt(tiempos[1]);
                const T3 = parseInt(tiempos[2]);

                const offset = ((T2 - T1) + (T3 - T4)) / 2;

                this.offset = offset;

                client.destroy();
            });

            client.on('close', () => { });

        }, this.periodo);
    }


}

module.exports.Reloj