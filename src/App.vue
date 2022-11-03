<template>
  <div>
    <NotificacaoAvisos :prop_notificacao="notificacao" />
    <PaginaInicial v-on:emite-notificacao="mostraNotificacao" />
  </div>
</template>

<script>
/* eslint-disable */
import PaginaInicial from "./components/PaginaInicial/PaginaInicial.vue";
import NotificacaoAvisos from "./components/Notificacao/NotificacaoAvisos.vue";

export default {
  components: {
    PaginaInicial,
    NotificacaoAvisos,
  },
  data() {
    return {
      notificacao: {
        mensagem: [""],
        tempo_mostrar: 0,
      },
    };
  },
  methods: {
    mostraNotificacao(msg = [], tempo_visivel = 0) {
      this.notificacao.mensagem = msg;
      this.notificacao.tempo_mostrar = tempo_visivel;
    },
  },
};
</script>

<style>
@import "./App.css";
</style>
