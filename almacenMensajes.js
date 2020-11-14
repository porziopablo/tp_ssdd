class AlmacenMensajes {
    constructor(idCliente) {
        this.idCliente = idCliente;
        this.colaMensajes = new Map();
        this.colaMensajes.set("all", new Set());
        this.colaMensajes.set(idCliente, new Set());
    }

    get getIdCliente() {
        return this.idCliente;
    }

    get getColaMensajes() {
        return this.colaMensajes;
    }

    almacenarMensaje(topico, mensaje) {
        if (this.getColaMensajes.has(topico)) { //all, idcliente o el de un grupo que ya exista en el map
            this.getColaMensajes.set(topico, this.getColaMensajes.get(topico).add(mensaje));
        }
        else {
            this.getColaMensajes.set(topico, new Set());
            this.getColaMensajes.get(topico).add(mensaje);
        }
    }

    obtenerMensajes(topico) {
        this.getColaMensajes.get(topico).values();
    }

}

module.exports = AlmacenMensajes