const net = require('net');

class Reloj {
    constructor(ip, puerto, periodo, verlog) {
        this.ip = ip;
        this.puerto = puerto;
        this.periodo = periodo;
        this.offset = 0;
        this.actualizarTiempo();
        this.verlog = verlog;
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

        const self = this;
        setInterval(function () {
            const client = new net.Socket();

            if (this.verlog == 'true')
                console.log(`Reloj: actualizando tiempo con Servidor NTP en ${self.ip}:${self.puerto}`);

            client.connect(self.puerto, self.ip, function () {
                const T1 = { t1: new Date().toISOString() }; 
                client.write(JSON.stringify(T1));
            });

            client.on('data', function (data) {
                const T4 = new Date().getTime(); 
                const respuesta = JSON.parse(data);

                const T1 = new Date(respuesta.t1).getTime();
                const T2 = new Date(respuesta.t2).getTime();
                const T3 = new Date(respuesta.t3).getTime();

                self.offset = ((T2 - T1) + (T3 - T4)) / 2;
                if (this.verlog == 'true')
                    console.log(`Reloj: offset con Servidor NTP: ${self.offset} ms.`)
                client.destroy();
            });

        }, self.periodo);
    }


}

module.exports = Reloj