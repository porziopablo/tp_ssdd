
class ListaConectados {

    constructor(relojNTP, plazoMax, periodo) {
        this.reloj = relojNTP;
        this.plazoMax = plazoMax ;
        this.periodo = periodo;
        this.clientes = new Map();
        this.controlConectados();
    }

    actualizarHeartbeat(mensaje) {

        const noEstabaConectado = !( this.clientes.has(mensaje.emisor) && this.clientes.get(mensaje.emisor).online ) ; 
        this.clientes.set(mensaje.emisor, { fecha: mensaje.fecha, online: true });

        return noEstabaConectado;
    }

    controlConectados() {

        const self = this;

        const estaDesconectado = function (cliente) {
            const diferencia = self.reloj.solicitarTiempo() - new Date(cliente.fecha).getTime();
            cliente.online = diferencia <= self.plazoMax;
        }

        const control = function () {
            //console.log("Lista: Controlando estado de clientes...");
            self.clientes.forEach(estaDesconectado);
        }

        setInterval(control, this.periodo);
    }

    obtenerLista() {
        return this.clientes.entries();
    }

    existeCliente(idCliente) {
        return this.clientes.has(idCliente);
    }
}

module.exports = ListaConectados;