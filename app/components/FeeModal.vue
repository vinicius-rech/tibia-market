<script setup lang="ts">
import { computed } from "vue";
const props = defineProps<{
  open: boolean;
  globalBuyFeePct: number;
  globalSellFeePct: number;
}>();

const emit = defineEmits<{
  (event: "close"): void;
  (event: "update:globalBuyFeePct", value: number): void;
  (event: "update:globalSellFeePct", value: number): void;
}>();

const buyFee = computed({
  get: () => props.globalBuyFeePct,
  set: (value: number) => emit("update:globalBuyFeePct", value),
});

const sellFee = computed({
  get: () => props.globalSellFeePct,
  set: (value: number) => emit("update:globalSellFeePct", value),
});
</script>

<template>
  <div
    v-if="open"
    class="modal-backdrop"
    @click.self="emit('close')"
  >
    <div class="modal">
      <div class="modal__header">
        <div>
          <p class="eyebrow">Taxas globais</p>
          <h3>Buy fee e Sell fee padr\u00f5es</h3>
        </div>
        <button class="ghost" type="button" @click="emit('close')">Fechar</button>
      </div>
      <div class="modal__body">
        <p class="helper">
          Estas taxas ser\u00e3o usadas em todas as ordens (novas ou editadas).
        </p>
        <div class="field two-col">
          <div>
            <label>Buy fee (%)</label>
            <input
              v-model.number="buyFee"
              type="number"
              min="0"
              max="100"
              step="0.01"
            />
          </div>
          <div>
            <label>Sell fee (%)</label>
            <input
              v-model.number="sellFee"
              type="number"
              min="0"
              max="100"
              step="0.01"
            />
          </div>
        </div>
        <p class="helper">
          Recalculo dos campos considera taxas herdadas de undercut + estas taxas
          globais.
        </p>
      </div>
      <div class="modal__footer">
        <button class="ghost" type="button" @click="emit('close')">
          Fechar
        </button>
      </div>
    </div>
  </div>
</template>
