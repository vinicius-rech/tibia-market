<script setup lang="ts">
import type { Ref } from "vue";

const props = defineProps<{
  open: boolean;
  importInput: Ref<HTMLInputElement | null> | null;
  errorMessage?: string | null;
}>();

const emit = defineEmits<{
  (event: "close"): void;
  (event: "export"): void;
  (event: "import", payload: Event): void;
  (event: "reset"): void;
}>();

function triggerImport() {
  props.importInput?.value?.click();
}
</script>

<template>
  <div
    v-if="open"
    class="modal-backdrop"
    @click.self="emit('close')"
  >
    <div class="modal backup">
      <div class="modal__header">
        <div>
          <p class="eyebrow">Backup</p>
          <h3>Exportar ou importar dados</h3>
        </div>
        <button class="ghost" type="button" @click="emit('close')">
          Fechar
        </button>
      </div>
      <div class="modal__body">
        <p class="helper">Exporte seu banco local para JSON ou importe um arquivo existente.</p>
        <button class="ghost" type="button" @click="emit('export')">
          Exportar backup
        </button>
        <button class="ghost" type="button" @click="triggerImport">
          Importar backup
        </button>
        <input
          :ref="importInput"
          class="hidden-file-input"
          type="file"
          accept="application/json"
          @change="emit('import', $event)"
        />
        <p class="helper error" v-if="props.errorMessage">Erro: {{ props.errorMessage }}</p>
        <p class="helper success" v-else>Dados locais em uso.</p>
        <button class="danger" type="button" @click="emit('reset')">
          Resetar banco local
        </button>
      </div>
      <div class="modal__footer">
        <button class="ghost" type="button" @click="emit('close')">
          Fechar
        </button>
      </div>
    </div>
  </div>
</template>
