class ColaMensajes {

    constructor(periodoCola, tamMaxCola, plazoMaxCola, relojNTP) {
        this.periodoCola = periodoCola;
        this.tamMaxCola = tamMaxCola;
        this.plazoMaxCola = plazoMaxCola;
        this.relojNTP = relojNTP;
        this.cola = new Map();
        this.comparador = function (msj1, msj2) { return new Date(msj1.fecha).getTime() - new Date(msj2.fecha).getTime() };
        this.eliminarMensajesViejos();
    }

    nuevoTopico(topico) {
        this.cola.set(topico, []);
    }

    obtenerTopicos() {
        let topicos = Array.from(this.cola.keys()); 

        topicos = topicos.sort(function (string1, string2) {
            const topico1 = string1.toLowerCase();
            const topico2 = string2.toLowerCase();
            let orden = 0;

            if (topico1 < topico2)
                orden = -1;
            else if (topico1 > topico2)
                orden = 1;

            return orden;
        });

        return topicos;
    }

    obtenerMensajes(topico) {
        let respuesta = [];

        if (this.cola.has(topico))
            respuesta = this.cola.get(topico);

        return respuesta;
    }

    borrarMensajes(topico) {
        let borrado = false;

        if (this.cola.has(topico)) {
            this.cola.set(topico, []);
            borrado = true;
        }

        return borrado;
    }

    almacenarMensaje(topico, mensaje) {
        let almacenado = false;

        if (this.cola.has(topico) && ! this.esViejo(mensaje)) {
            let colaTopico = this.cola.get(topico);
            if (colaTopico.length === this.tamMaxCola) {
                colaTopico.shift();
            }
            colaTopico.push(mensaje);
            colaTopico = colaTopico.sort(this.comparador);
            this.cola.set(topico, colaTopico);
            almacenado = true;
        }

        return almacenado;
    }

    responsableTopico(topico) {
        return this.cola.has(topico);
    }

    esViejo(mensaje) {
        const diferencia = this.relojNTP.solicitarTiempo() - new Date(mensaje.fecha).getTime(); // usar valor absoluto ?

        return diferencia > this.plazoMaxCola;
    }

    eliminarMensajesViejos() {
        
        const self = this;
        const eliminar = function () {

            console.log("Cola de Mensajes: borrando mensajes viejos...");

            const iterator = self.cola.entries();
            let proximo = iterator.next();
            let cola;
            let topico;

            while (!proximo.done) {
                topico = proximo.value[0];
                cola = proximo.value[1];

                cola = cola.filter(function (msj) { return !self.esViejo(msj) });
                self.cola.set(topico, cola);

                proximo = iterator.next();
            }
        }

        setInterval(eliminar, this.periodoCola);
    }
}

module.exports = ColaMensajes;