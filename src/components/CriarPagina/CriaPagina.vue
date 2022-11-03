<template>
  <div class="criar-pagina">
    <p class="titulo">{{ prop_editando ? "Editando" : "Nova Pagina" }}</p>
    <div class="campo">
      <p>Nome da Pagina</p>
      <input type="text" placeholder="PAGINA 1" v-model="nome_pagina" />
    </div>

    <div class="separador"></div>

    <div class="palavras">
      <p class="titulo">Palavras-chaves</p>
      <div
        class="palavra"
        v-for="(palavra_objeto, key_palavra) in palavras_chaves"
        v-bind:key="key_palavra"
      >
        <input
          type="text"
          :value="palavra_objeto.palavra"
          placeholder="..."
          @change="
            changeConteudoPalavra(palavra_objeto.id, $event.target.value)
          "
        />
        <div class="acoes">
          <button
            class="remover"
            @click="clickRemoverPalavraChave(palavra_objeto.id)"
          >
            Remover
          </button>
        </div>
      </div>

      <div class="separador"></div>

      <div class="acoes">
        <button class="adicionar" @click="clickNovaPalavraChave()">Nova palavra-chave</button>
      </div>
    </div>

    <div class="separador"></div>

    <div class="acoes">
      <button
        class="salvar"
        @click="confirmarCadastro()"
        :disabled="palavras_chaves.length === 0"
      >
        {{ prop_editando ? "Salvar mudanças" : "Criar pagina" }}
      </button>
      <button class="fechar" @click="cancelar()">Fechar</button>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    prop_editando: {
      type: Boolean,
      default: () => false,
    },
    prop_dados_editando: {
      type: Object,
    },
  },
  beforeMount() {
    if (this.prop_editando) {
      console.log(`Carregando dados para ediçã:`);
      console.log(this.prop_dados_editando);

      this.nome_pagina = this.prop_dados_editando.nome_pagina;
      this.palavras_chaves = this.prop_dados_editando.palavras_chaves;
      this.id_pagina = this.prop_dados_editando.id;
      this.palavras_chave_id_unico = this.palavras_chaves.length + 1;
    }
  },
  data() {
    return {
      nome_pagina: "",
      palavras_chaves: [],
      palavras_chave_id_unico: 0,
      id_pagina: -1,
    };
  },
  methods: {
    confirmarCadastro() {
      this.$emit("confirma", {
        nome_pagina: this.nome_pagina,
        palavras_chaves: this.palavras_chaves,
        id: this.id_pagina,
      });
    },
    cancelar() {
      this.$emit("cancelar");
    },
    clickNovaPalavraChave() {
      this.palavras_chaves.push({
        id: this.palavras_chave_id_unico,
        palavra: "",
      });
      this.palavras_chave_id_unico++;
    },
    clickRemoverPalavraChave(palavra_chave_id) {
      this.palavras_chaves = this.palavras_chaves.filter(
        (palavra) => palavra.id != palavra_chave_id
      );
    },
    changeConteudoPalavra(palavra_chave_id, novo_conteudo) {
      console.log(
        `Alterou palavra-chave id ${palavra_chave_id} para ${novo_conteudo}`
      );
      let palavra_objeto = this.palavras_chaves.find(
        (palavra) => palavra.id == palavra_chave_id
      );
      if (palavra_objeto != undefined) {
        palavra_objeto.palavra = novo_conteudo;
      }
    },
  },
};
</script>

<style scoped>
@import "./CriaPagina.css";
</style>