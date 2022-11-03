/* eslint-disable */
import ArquivoPagina from "./ArquivoPagina.js"
import { ipcRenderer } from "electron";

export default class ArquivoPdf {

    /**
     * O caminho até o PDF
     * @type {String}
     */
    caminho_pdf = ""

    /**
     * As paginas existentes no PDF
     * @type {[ArquivoPagina]}
     */
    paginas_existentes = []

    /**
     * Inicia um novo objeto arquivo PDF
     * @param {String} caminho_arquivo 
     */
    constructor(caminho_arquivo) {
        this.caminho_pdf = caminho_arquivo
    }

    /**
     * Carregar o arquivo PDF atual
     */
    async carregar() {
        this.paginas_existentes = []
        let status_leitura = await this.lerPdf()

        if (status_leitura.sucesso) {
            this.paginas_existentes = status_leitura.paginas
        }
    }

    /**
     * Ler o arquivo PDF atual 
     * @returns {{status: Boolean, paginas: [ArquivoPagina]}}
     */
    async lerPdf() {
        let status = {
            sucesso: false,
            paginas: []
        }

        let conteudo_arquivo = await ipcRenderer.invoke("ler-pdf", this.caminho_pdf)
        if (!conteudo_arquivo.sucesso) {
            console.log(`Erro ao efetuar leitura do PDF: ${this.caminho_pdf}`);
            return
        }

        let paginas = []
        let pagina_atual = 0
        /**
        * @type {ArquivoPagina}
         */
        let pagina_objeto;
        for (const conteudo of conteudo_arquivo.conteudo) {
            if (conteudo.page != undefined) {
                pagina_atual = conteudo.page

                pagina_objeto = new ArquivoPagina(pagina_atual)
                paginas.push(pagina_objeto)
            }

            let conteudo_texto = conteudo.text
            if (conteudo_texto != undefined) {
                pagina_objeto.textos_encontrados.push(conteudo_texto)
            }
        }

        status.sucesso = true
        status.paginas = paginas

        return status
    }
}