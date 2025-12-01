<script setup lang="ts">
import type { Ref } from "vue";
import { useI18n } from "~/composables/useI18n";

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

const { messages } = useI18n();

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
          <p class="eyebrow">{{ messages.backup.eyebrow }}</p>
          <h3>{{ messages.backup.title }}</h3>
        </div>
        <button class="ghost" type="button" @click="emit('close')">
          {{ messages.common.close }}
        </button>
      </div>
      <div class="modal__body">
        <p class="helper label-with-icon">
          <span>{{ messages.backup.helper }}</span>
          <span
            class="info-icon"
            role="img"
            :title="messages.backup.helper"
            :aria-label="messages.backup.helper"
          >
            ?
          </span>
        </p>
        <button class="ghost" type="button" @click="emit('export')">
          {{ messages.backup.export }}
        </button>
        <button class="ghost" type="button" @click="triggerImport">
          {{ messages.backup.import }}
        </button>
        <input
          :ref="importInput"
          class="hidden-file-input"
          type="file"
          accept="application/json"
          @change="emit('import', $event)"
        />
        <p class="helper error" v-if="props.errorMessage">
          {{ messages.backup.errorPrefix }}: {{ props.errorMessage }}
        </p>
        <p class="helper success" v-else>{{ messages.backup.success }}</p>
        <button class="danger" type="button" @click="emit('reset')">
          {{ messages.backup.reset }}
        </button>
      </div>
      <div class="modal__footer">
        <button class="ghost" type="button" @click="emit('close')">
          {{ messages.common.close }}
        </button>
      </div>
    </div>
  </div>
</template>
