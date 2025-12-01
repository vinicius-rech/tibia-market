<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "~/composables/useI18n";

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

const { messages } = useI18n();
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
          <p class="eyebrow">{{ messages.fee.eyebrow }}</p>
          <h3>{{ messages.fee.title }}</h3>
        </div>
        <button class="ghost" type="button" @click="emit('close')">
          {{ messages.common.close }}
        </button>
      </div>
      <div class="modal__body">
        <p class="helper">
          {{ messages.fee.helper }}
        </p>
        <div class="field two-col">
          <div>
            <label class="label-with-icon">
              <span>{{ messages.fee.buyLabel }}</span>
              <span
                class="info-icon"
                role="img"
                :title="messages.fee.buyTooltip"
                :aria-label="messages.fee.buyTooltip"
              >
                ?
              </span>
            </label>
            <input
              v-model.number="buyFee"
              type="number"
              min="0"
              max="100"
              step="0.01"
            />
          </div>
          <div>
            <label class="label-with-icon">
              <span>{{ messages.fee.sellLabel }}</span>
              <span
                class="info-icon"
                role="img"
                :title="messages.fee.sellTooltip"
                :aria-label="messages.fee.sellTooltip"
              >
                ?
              </span>
            </label>
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
          {{ messages.fee.recalculation }}
        </p>
      </div>
      <div class="modal__footer">
        <button class="ghost" type="button" @click="emit('close')">
          {{ messages.common.close }}
        </button>
      </div>
    </div>
  </div>
</template>
