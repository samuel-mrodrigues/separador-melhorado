export default class Pagina {

    /**
     * Numero da pagina
     * @type {Number}
     */
    num_pagina = -1

    /**
     * Todos os tipos de textos encontrados nesse arquivo PDF
     * @type {[String]}
     */
    textos_encontrados = []

    constructor(numero) {
        this.num_pagina = numero
    }
}