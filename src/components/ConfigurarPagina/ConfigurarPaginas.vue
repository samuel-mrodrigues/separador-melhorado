<template>
  <div>
    <p class="titulo">Configuração de Paginas</p>
    <div class="flutuante">
      <CriaPagina
        v-if="cadastro.cadastrando"
        v-on:confirma="onConfirmaCadastro"
        v-on:cancelar="onCancelaCadastro()"
        :prop_editando="cadastro.editando"
        :prop_dados_editando="cadastro.dados_edicao"
      />
    </div>

    <div class="paginas">
      <div
        class="pagina"
        v-for="(pagina_objeto, key_pagina) in paginas_criadas"
        v-bind:key="key_pagina"
      >
        <p class="nome">
          Pagina
          <span style="font-weight: bold">{{ pagina_objeto.nome_pagina }}</span>
        </p>
        <p>
          Palavras-chaves:
          <span style="font-weight: bold">
            {{
              pagina_objeto.palavras_chaves
                .map((palavra_objeto) => palavra_objeto.palavra)
                .toString()
            }}
          </span>
        </p>

        <div class="acoes">
          <button class="excluir" @click="clickExcluirPagina(pagina_objeto.id)">
            Excluir Pagina
          </button>

          <button class="editar" @click="clickEditarPagina(pagina_objeto.id)">
            Editar
          </button>
        </div>
      </div>
    </div>

    <div>
      <button @click="clickAddPagina">Adicionar Pagina</button>
    </div>
  </div>
</template>

<script>
import CriaPagina from "../CriarPagina/CriaPagina.vue";
import fs from "fs";
import path from "path";

export default {
  components: {
    CriaPagina,
  },
  data() {
    return {
      cadastro: {
        cadastrando: false,
        editando: false,
        dados_edicao: {},
      },
      paginas_criadas: [],
      id_unico: 0,
      arquivo_salvamento: "",
    };
  },
  beforeMount() {
    this.arquivo_salvamento = `${path.resolve("./")}\\paginas_salvas.json`;
    this.carregarPaginasSalvas();
  },
  methods: {
    clickAddPagina() {
      this.cadastro = {
        cadastrando: true,
        editando: false,
        dados_edicao: {},
      };
      this.emiteNovasMudancas();
    },
    clickExcluirPagina(id_pagina) {
      this.paginas_criadas = this.paginas_criadas.filter(
        (pagina) => pagina.id != id_pagina
      );

      this.emiteNovasMudancas();
      this.salvarPaginas();
    },
    clickEditarPagina(id_pagina) {
      console.log(`Iniciando edição da pagina ID: ${id_pagina}`);
      let pagina_objeto = this.paginas_criadas.find(
        (pagina) => pagina.id == id_pagina
      );
      if (pagina_objeto != undefined) {
        this.cadastro = {
          cadastrando: true,
          editando: true,
          dados_edicao: pagina_objeto,
        };
      }
    },
    emiteNovasMudancas() {
      this.$emit("alteracao-paginas", this.paginas_criadas);
    },
    salvarPaginas() {
      console.log(`Salvando paginas no arquivo...`);
      fs.writeFileSync(
        this.arquivo_salvamento,
        JSON.stringify({
          paginas_salvas: this.paginas_criadas,
        })
      );
    },
    carregarPaginasSalvas() {
      console.log(`Carregando paginas salvas...`);
      try {
        let json_dados = fs.readFileSync(this.arquivo_salvamento);

        json_dados = JSON.parse(json_dados);

        this.paginas_criadas = json_dados.paginas_salvas;
        this.id_unico = this.paginas_criadas.length;
        this.emiteNovasMudancas();
      } catch (ex) {
        console.log(`Erro ao ler arquivo de paginas salvas`);
      }
    },
    /**
     * @param {{id: Number, nome_pagina: String, palavras_chaves: Array}} pagina_dados
     */
    onConfirmaCadastro(pagina_dados) {
      this.cadastro.cadastrando = false;

      if (pagina_dados.id == -1) {
        console.log(`Inserndo nova pagina...`);
        this.paginas_criadas.push({
          id: this.id_unico,
          nome_pagina: pagina_dados.nome_pagina,
          palavras_chaves: pagina_dados.palavras_chaves,
        });
        this.id_unico++;
      } else {
        console.log(`Realizando mudança em pagina existente...`);
        let pagina_objeto_antigo = this.paginas_criadas.find(
          (pagina_objeto) => pagina_objeto.id == pagina_dados.id
        );
        if (pagina_objeto_antigo != undefined) {
          pagina_objeto_antigo.nome_pagina = pagina_dados.nome_pagina;
          pagina_objeto_antigo.palavras_chaves = pagina_dados.palavras_chaves;
        }
      }
      this.salvarPaginas();
    },
    onCancelaCadastro() {
      this.cadastro.cadastrando = false;
      this.cadastro.editando = false;
      this.cadastro.dados_edicao = {};
    },
  },
};
</script>

<style scoped>
@import "./ConfigurarPaginas.css";
</style>