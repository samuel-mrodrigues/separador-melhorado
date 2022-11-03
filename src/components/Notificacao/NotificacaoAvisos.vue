<template>
  <Transition name="teste">
    <div v-if="mostrar" class="notificacao">
      <p
        v-for="(mensagem, key_msg) in mensagem_notificacao"
        v-bind:key="key_msg"
      >
        {{ mensagem }}
      </p>
    </div>
  </Transition>
</template>

<script>
export default {
  props: {
    prop_notificacao: {
      type: Object,
      default: () => {
        return {
          mensagem: [],
          tempo_mostrar: 4,
        };
      },
    },
  },
  data() {
    return {
      mostrar: false,
      /**
       * @type {{mensagem: [String], tempo_mostrar: Number}}
       */
      mensagem: this.prop_notificacao,
      taskid_timeout: -1,
    };
  },
  watch: {
    mensagem: {
      handler() {
        this.tratarNovaNotificacao();
      },
      deep: true,
    },
  },
  methods: {
    tratarNovaNotificacao() {
      if (!this.mostrar) this.mostrar = true;

      if (this.mensagem.tempo_mostrar != 0) {
        if (this.taskid_timeout != -1) {
          clearTimeout(this.taskid_timeout);
        }

        this.taskid_timeout = setTimeout(() => {
          this.mostrar = false;
          this.taskid_timeout = -1;
        }, this.mensagem.tempo_mostrar * 1000);
      }
    },
  },
  computed: {
    mensagem_notificacao() {
      return this.mensagem.mensagem;
    },
  },
};
</script>

<style scoped>
.notificacao {
  position: absolute;
  word-wrap: nowrap;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgb(237, 237, 237);

  padding: 5px;
  border-radius: 5px;
  border-bottom: 3px solid rgb(208, 196, 39);
}

.notificacao p {
  color: black;
  font-weight: bold;
  font-size: 1rem;
  padding: 0;
  margin: 0;
}

.teste-enter-from,
.teste-leave-to {
  opacity: 0;
}

.teste-enter-active,
.teste-leave-active {
  transition: opacity 1s;
}
</style>