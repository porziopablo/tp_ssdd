const net = require('net');

class Reloj {
    constructor(ip, puerto, periodo) {
        this.ip = ip;
        this.puerto = puerto;
        this.periodo = periodo;
        this.offset = 0;
    }

    get getIp() {
        return this.ip;
    }

    get getPuerto() {
        return this.puerto;
    }

    get getPeriodo() {
        return this.periodo;
    }

    get getOffset() {
        return this.offset;
    }

    solicitarTiempo() {
        const tAct = (new Date()).getTime() + this.offset;
        return tAct;
    }

    actualizarTiempo() {

        var funcionIntervalo = setInterval(function () {
            const client = new net.Socket();

            client.connect(this.puerto, this.ip, function () {
                const T1 = { "t1": (new Date().toISOString()) }; 
                client.write(JSON.stringify(T1));
            });

            client.on('data', function (respuesta) {
                const T4 = (new Date()).getTime(); 
                const tiempos = respuesta.toString().split(',');

                const T1 = Date.parse(tiempos[0]);
                const T2 = Date.parse(tiempos[1]);
                const T3 = Date.parse(tiempos[2]);

                const offset = ((T2 - T1) + (T3 - T4)) / 2;
                this.offset = offset;
                client.destroy();
            });

        }, this.periodo);
        funcionIntervalo();
    }


}

module.exports = Reloj