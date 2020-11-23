const PUB = 'PUB';

class AlmacenBroker {

    constructor(datosBroker) {
        this.mapBrokers = new Map(); // (id_broker, {datos})
        this.prox = 0;

        const self = this; // inicializo el map
        datosBroker.forEach((broker) => {
            self.mapBrokers.set(broker.idBroker, {
                "ipBroker": broker.ipBroker, "puertoPub": broker.puertoPub,
                "puertoSub": broker.puertoSub, "puertoRep": broker.puertoRep,
                "listaTopicos": []
            })
        });
    }

    buscarBroker(topico, tipoPuerto) {
        let rta = null;
        let topicos;
        let itBroker = this.mapBrokers.values();
        let proximo = itBroker.next();
        let encontro = false;
        while (!proximo.done && !encontro) {
            topicos = proximo.value.listaTopicos;
            if (topicos.includes(topico)) {
                if (tipoPuerto == PUB)
                    rta = { "topico": topico,"ip": proximo.value.ipBroker, "puerto": proximo.value.puertoPub };
                else
                    rta = { "topico": topico,"ip": proximo.value.ipBroker, "puerto": proximo.value.puertoSub };
                encontro = true;
            }

            proximo = itBroker.next();
        }

        return rta;
    }

    pedirBroker(topico, tipoPuerto) {
        let rta;
        const brokers = Array.from(this.mapBrokers.values());
        const brokerElegido = brokers[this.prox];
        brokerElegido.listaTopicos.push(topico);
        if (this.prox == (brokers.length - 1))
            this.prox = 0;
        else
            this.prox++;
        if (tipoPuerto == PUB) {
            rta = { "topico": topico,"ip": brokerElegido.ipBroker, "puertoRep": brokerElegido.puertoRep, "puerto": brokerElegido.puertoPub }
        }
        else
            rta = { "topico": topico,"ip": brokerElegido.ipBroker, "puertoRep": brokerElegido.puertoRep, "puerto": brokerElegido.puertoSub }
        return rta;
    }
}

module.exports = AlmacenBroker;