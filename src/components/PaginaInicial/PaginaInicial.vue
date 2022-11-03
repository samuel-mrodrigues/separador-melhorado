<template>
  <div class="pagina-inicial">
    <div class="seleciona-pdf">
      <p class="titulo" v-if="pdfs_selecionados.length == 0">
        Selecione o(s) arquivo(s) PDF(s)
      </p>
      <p class="titulo" v-if="pdfs_selecionados.length != 0">
        {{
            pdfs_selecionados.length == 1
              ? `PDF selecionado: ${pdfs_selecionados[0].local_arquivo}`
              : `Selecionado ${pdfs_selecionados.length} PDFs`
        }}
      </p>

      <div class="acoes">
        <button @click="selecionarPdf()">Selecionar PDF</button>
        <button @click="selecionarDiretorio()">+Incluir varios</button>
      </div>
    </div>

    <div class="separador"></div>

    <div class="seleciona-salvar">
      <p class="titulo">Onde salvar?</p>
      <p>
        Utilize a variavel %produto% para ter acesso ao produto sendo salvo na
        hora da separação
      </p>
      <input v-show="local_salvamento != ''" type="text" v-model="local_salvamento"
        @keydown="$event.target.style.width = `${$event.target.value.length}ch`" @change="digitouCampoSalvamento()" />
      <div class="acoes">
        <button @click="selecionarLocalSalvar()">Escolher local</button>
      </div>
    </div>

    <div class="separador"></div>
    <div v-if="pdfs_selecionados.length != 0">
      <ConfigurarPaginas v-on:alteracao-paginas="onAlterouPagina" />
      <div class="separador"></div>
    </div>

    <button v-if="pdfs_selecionados.length != 0 && local_salvamento != ''" @click="iniciarSeparacao">
      Iniciar Separação
    </button>
  </div>
</template>

<script>
/* eslint-disable */
import { ipcRenderer } from "electron";
import ArquivoPDF from "../../utils/ArquivoPDF.js";
import fs from "fs";

const { PDFDocument } = require("pdf-lib");

import ConfigurarPaginas from "../ConfigurarPagina/ConfigurarPaginas.vue";
import path from "path";

export default {
  name: "App",
  components: {
    ConfigurarPaginas,
  },
  data() {
    return {
      /**
       * @type {[{nome_arquivo: String, local_arquivo: String}]}
       */
      pdfs_selecionados: [],
      /**
       * @type {[{id: Number, nome_pagina: String, palavras_chaves: [{id: Number, palavra: String}]}]}
       */
      paginas_configuradas: [],
      local_salvamento: "",
    };
  },
  methods: {
    async selecionarPdf() {
      let caminho_selecionado = await ipcRenderer.invoke("selecionar-pdf");

      if (caminho_selecionado != undefined) {
        this.pdfs_selecionados.push({
          nome_arquivo: `${caminho_selecionado.substr(
            caminho_selecionado.toLowerCase().indexOf(".pdf") + 1,
            -1
          )}`,
          local_arquivo: `${caminho_selecionado}`,
        });
      }

      console.log(this.pdfs_selecionados);
    },
    async selecionarDiretorio() {
      let diretorio_selecionado = await ipcRenderer.invoke(
        "selecionar-diretorio"
      );

      if (diretorio_selecionado != undefined) {
        let arquivos_pdfs = await this.lerArquivosDiretorio(
          diretorio_selecionado
        );
        this.pdfs_selecionados = this.pdfs_selecionados.concat(arquivos_pdfs);

        this.mostraAviso(
          [`Encontrado ${arquivos_pdfs.length} PDFs no diretorio selecionado!`],
          4
        );
      }
    },
    async selecionarLocalSalvar() {
      let diretorio_selecionado = await ipcRenderer.invoke(
        "selecionar-diretorio"
      );

      if (diretorio_selecionado != undefined) {
        this.local_salvamento = `${diretorio_selecionado}\\%produto%`;
        this.mostraAviso(
          [`Local de salvamento definido para ${diretorio_selecionado}`],
          4
        );
      }
    },
    digitouCampoSalvamento() {
      if (this.local_salvamento.indexOf("%produto%") == -1) {
        this.local_salvamento = `${this.local_salvamento}\\%produto%`;
      }
    },
    async iniciarSeparacao() {
      if (this.pdfs_selecionados.length == 0) {
        console.log(`Ignorando separação pois não foi selecionado nenhum PDF`);
        return;
      }
      console.log(
        `Iniciando separação para ${this.pdfs_selecionados.length} PDFs`
      );
      this.mostraAviso([
        `Iniciando separação para ${this.pdfs_selecionados.length} PDFs`,
      ]);
      await this.pausar(2);

      let progresso_leitura = 0;
      let arquivos_separar = [];
      for (const arquivo_pdf of this.pdfs_selecionados) {
        progresso_leitura++;
        // console.log(`Analisando PDF: ${arquivo_pdf.nome_arquivo}`);
        this.mostraAviso([
          `Analisando PDF: ${arquivo_pdf.nome_arquivo} ${progresso_leitura}/${this.pdfs_selecionados.length}`,
        ]);

        let pdf_objeto = new ArquivoPDF(arquivo_pdf.local_arquivo);
        await pdf_objeto.carregar();

        let templates_corretos = [];
        for (const template_pagina of this.paginas_configuradas) {
          // console.log(
          //   `Comparando com o template: ${template_pagina.nome_pagina}`
          // );

          let melhor_template = {
            palavras_achadas: 0,
            pagina_numero: -1
          };

          for (const pagina of pdf_objeto.paginas_existentes) {
            // console.log(`Analisando pagina numero ${pagina.num_pagina}`);

            let palavras_encontradas = template_pagina.palavras_chaves.filter(
              (palavra_objeto) => {
                let existe_palavra = pagina.textos_encontrados.find(
                  (palavra_pagina) => {
                    if (palavra_pagina.indexOf(palavra_objeto.palavra) != -1)
                      return true;
                  }
                );

                if (existe_palavra != undefined) return true;
              }
            );

            // console.log(`Palavras encontradas:`);
            // console.log(palavras_encontradas);

            if (palavras_encontradas.length == 0) {
              // console.log(
              //   `Pulando para proxiam pagina pois não foi encontrado nenhuma palavra parecida!`
              // );
              continue;
            }

            if (
              palavras_encontradas.length > melhor_template.palavras_achadas
            ) {
              // console.log(`Substituindo por um template mais preciso!`);
              melhor_template.palavras_achadas = palavras_encontradas.length;
              melhor_template.pagina_numero = pagina.num_pagina;
            }
          }

          if (melhor_template.pagina_numero == -1) {
            // console.log(
            //   `Template ${template_pagina.nome_pagina} não é parecido com nenhuma pagina`
            // );
            continue;
          }

          let ja_existe = templates_corretos.find(
            (template_objeto) =>
              template_objeto.pagina_numero == melhor_template.pagina_numero
          );

          if (ja_existe == undefined) {
            // console.log(
            //   `Setando pagina n${melhor_template.pagina_numero} para o template ${template_pagina.nome_pagina}`
            // );
            templates_corretos.push({
              template: template_pagina,
              pagina_numero: melhor_template.pagina_numero,
              palavras_achadas: melhor_template.palavras_achadas,
            });
          } else {
            if (melhor_template.palavras_achadas > ja_existe.palavras_achadas) {
              // console.log(
              //   `Achei o template ${template_pagina.nome_pagina} que se encaixa melhor para a pagina ${ja_existe.pagina_numero}`
              // );
              ja_existe.template = template_pagina;
              ja_existe.palavras_achadas = melhor_template.palavras_achadas;
            }
          }
        }

        arquivos_separar.push({
          pdf_objeto: pdf_objeto,
          paginas: templates_corretos,
        });
      }

      console.log(`Iniciando a separação dos arquivos`);
      console.log(arquivos_separar);
      await this.pausar(2);

      let progresso_salvamento = 0;
      let erros_copiar = [];
      for (const pdf_separar of arquivos_separar) {
        try {
          let nome_arquivo = path.basename(pdf_separar.pdf_objeto.caminho_pdf);
          nome_arquivo = path.parse(nome_arquivo).name
          nome_arquivo = nome_arquivo.replaceAll(".", "").replaceAll("$", "").replaceAll("~", "").replaceAll("^", "").replaceAll(",", "")

          // console.log(`Separando PDF ${nome_arquivo}`);
          this.mostraAviso([
            `Separando PDF ${nome_arquivo} ${progresso_salvamento}/${arquivos_separar.length}`,
          ]);

          let pdf_documento_obj = await PDFDocument.load(
            fs.readFileSync(pdf_separar.pdf_objeto.caminho_pdf)
          );

          for (const pagina_copiar of pdf_separar.paginas) {
            let novo_documento_pdf = await PDFDocument.create();
            // console.log(
            //   `Copiando pagina ${
            //     pagina_copiar.pagina_numero - 1
            //   } para um novo documento`
            // );

            let paginaCopiada;
            try {
              paginaCopiada = await novo_documento_pdf.copyPages(
                pdf_documento_obj,
                [pagina_copiar.pagina_numero - 1]
              );
            } catch (ex) {
              console.log(ex);
              console.log(`Ocorreu um erro ao realizar copia de ${nome_arquivo}, ignorando...`);
              erros_copiar.push({
                produto: nome_arquivo,
              });
              continue;
            }
            novo_documento_pdf.addPage(paginaCopiada[0]);

            let local_salvamento = `${this.local_salvamento}`;
            local_salvamento = local_salvamento.replaceAll("%produto%", nome_arquivo);
            if (!fs.existsSync(local_salvamento)) {
              fs.mkdirSync(local_salvamento);
            }

            local_salvamento = `${local_salvamento}\\${pagina_copiar.template.nome_pagina}.pdf`;
            // console.log(`Local para salvamento: ${local_salvamento}`);
            fs.writeFileSync(local_salvamento, await novo_documento_pdf.save(), {
              encoding: "utf8",
            });
          }
          progresso_salvamento++;
        } catch (ex) {
          console.log(ex);
          console.log(`Erro ao separar o PDF:`);
          console.log(pdf_separar);
        }
      }

      this.mostraAviso([
        `Separação finalizada, um total de ${progresso_salvamento} foram divididos`,
        `${erros_copiar.length != 0
          ? `${erros_copiar.length} não puderam ser separados`
          : "Nenhum erro ao separar"
        }`,
      ]);
    },
    onAlterouPagina(novos_dados) {
      console.log(`Nova alteração de pagina recebida!`);
      this.paginas_configuradas = novos_dados;
    },
    async lerArquivosDiretorio(diretorio_principal) {
      await this.pausar(0.05);
      this.mostraAviso(
        [`Encontrando PDFs...`, `Lendo pasta (${diretorio_principal})`],
        2
      );

      let arquivos_contidos = fs.readdirSync(diretorio_principal);

      let arquivos_pdfs_encontrados = [];
      for (const arquivo_lido of arquivos_contidos) {
        if (fs.statSync(`${diretorio_principal}\\${arquivo_lido}`).isFile()) {
          if (arquivo_lido.toLowerCase().indexOf(".pdf") == -1) {
            continue;
          }
          arquivos_pdfs_encontrados.push({
            nome_arquivo: `${arquivo_lido}`,
            local_arquivo: `${diretorio_principal}\\${arquivo_lido}`,
          });
        } else {
          let pdfs_encontrados = await this.lerArquivosDiretorio(
            `${diretorio_principal}\\${arquivo_lido}`,
            false
          );
          arquivos_pdfs_encontrados =
            arquivos_pdfs_encontrados.concat(pdfs_encontrados);
        }
      }

      return arquivos_pdfs_encontrados;
    },
    async pausar(segs) {
      return new Promise((resolve) => {
        setTimeout(
          () => {
            resolve();
          },
          segs != undefined ? segs * 1000 : 1000
        );
      });
    },
    mostraAviso(msg, tempo) {
      this.$emit("emite-notificacao", msg, tempo);
    },
  },
};
</script>

<style>
@import "./PaginaInicial.css";
</style>