<script setup lang="ts">
import { useI18n } from "~/composables/useI18n";
import type { Metrics, Trade, TradeInput } from "~/types/trade";

const show = defineModel<boolean>("show");
const form = defineModel<TradeInput>("form");

const props = defineProps<{
  items: string[];
  trades: Trade[];
  editingTradeId: number | null;
  saving: boolean;
  filteredItems: string[];
  showSuggestions: boolean;
  highlightedSuggestion: number;
  maxDuplications: number;
  derived: Metrics;
  selectedParentId: number | null;
  canRegisterItem: boolean;
  formatGold: (value: number) => string;
  formatUnits: (value: number) => string;
  onSubmit: () => void;
  onRegisterItem: () => void;
  onSelectSuggestion: (name: string) => void;
  onMoveSuggestion: (step: number) => void;
  onTabComplete: () => void;
  onDeleteSuggestion: (event: KeyboardEvent) => void;
  onHandleItemInput: () => void;
  onHandleItemFocus: () => void;
  onHandleItemBlur: () => void;
}>();

const emit = defineEmits<{
  (event: "close"): void;
  (event: "reset-form", value?: string): void;
}>();

const { messages, t } = useI18n();

function handleKeydown(event: KeyboardEvent) {
  if (!show.value || event.key !== "Escape") return;
  emit("close");
}

onMounted(() => {
  if (typeof window === "undefined") return;
  window.addEventListener("keydown", handleKeydown);
});

onBeforeUnmount(() => {
  if (typeof window === "undefined") return;
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <div
    v-if="show"
    class="modal-backdrop"
  >
    <div class="modal modal--wide">
      <div class="modal__header">
        <div>
          <p class="eyebrow">
            {{
              editingTradeId
                ? t("tradeModal.eyebrowEdit", { id: editingTradeId })
                : messages.tradeModal.eyebrowNew
            }}
          </p>
          <h3>{{ form.item || messages.tradeModal.defaultTitle }}</h3>
        </div>
        <div class="panel__actions">
          <button
            class="ghost"
            type="button"
            @click="emit('close')"
          >
            {{ messages.common.close }}
          </button>
        </div>
      </div>
      <div class="modal__body">
        <div class="grid">
          <form class="form" @submit.prevent="onSubmit">
            <div class="field">
              <label for="item">{{ messages.tradeModal.itemLabel }}</label>
              <div class="autocomplete">
                <input
                  id="item"
                  v-model.trim="form.item"
                  type="text"
                  required
                  autocomplete="off"
                  @focus="onHandleItemFocus"
                  @input="onHandleItemInput"
                  @blur="onHandleItemBlur"
                  @keydown.down.prevent="onMoveSuggestion(1)"
                  @keydown.up.prevent="onMoveSuggestion(-1)"
                  @keydown.enter.prevent="onTabComplete"
                  @keydown.tab.prevent="onTabComplete"
                  @keydown.delete="onDeleteSuggestion"
                />
                <ul
                  v-if="showSuggestions && filteredItems.length"
                  class="suggestions"
                  role="listbox"
                >
                  <li
                    v-for="(suggestion, index) in filteredItems"
                    :key="suggestion"
                    :class="{ 'is-active': index === highlightedSuggestion }"
                    role="option"
                  >
                    <button
                      type="button"
                      @mousedown.prevent="onSelectSuggestion(suggestion)"
                    >
                      {{ suggestion }}
                    </button>
                  </li>
                </ul>
              </div>
              <p class="helper">{{ messages.tradeModal.helper }}</p>
              <button
                v-if="canRegisterItem"
                class="ghost inline"
                type="button"
                :disabled="saving"
                @click="onRegisterItem"
              >
                {{ t("tradeModal.registerItem", { item: form.item.trim() }) }}
              </button>
            </div>
            <div class="field two-col">
              <div>
                <label>{{ messages.tradeModal.bid }}</label>
                <input v-model.number="form.bid" type="number" min="0" step="1" required />
              </div>
              <div>
                <label>{{ messages.tradeModal.ask }}</label>
                <input v-model.number="form.ask" type="number" min="0" step="1" required />
              </div>
            </div>
            <div class="field two-col">
              <div>
                <label>{{ messages.tradeModal.buyUnits }}</label>
                <input v-model.number="form.buyUnits" type="number" min="0" step="1" required />
              </div>
              <div>
                <label>{{ messages.tradeModal.sellUnits }}</label>
                <input v-model.number="form.sellUnits" type="number" min="0" step="1" required />
              </div>
            </div>
            <div class="field">
              <label>{{ messages.tradeModal.undercut }}</label>
              <select v-model.number="form.parentTradeId">
                <option :value="null">{{ messages.tradeModal.noUndercut }}</option>
                <option
                  v-for="trade in trades"
                  :key="trade.id"
                  :value="trade.id"
                  :disabled="editingTradeId === trade.id"
                >
                  #{{ trade.id }} {{ trade.item }} {{ messages.tradeModal.undercutFeesLabel }}
                  {{ formatGold(trade.cumulativeFees) }}
                </option>
              </select>
              <p class="helper">
                {{ messages.tradeModal.undercutHelp }}
              </p>
            </div>
            <div class="field">
              <label>{{ messages.tradeModal.duplicateLabel }}</label>
              <input
                v-model.number="form.duplicationCount"
                type="number"
                min="1"
                :max="maxDuplications"
                step="1"
                :disabled="!!editingTradeId"
              />
              <p class="helper">
                {{ t("tradeModal.duplicateHelp", { limit: maxDuplications }) }}
              </p>
            </div>
            <div class="field">
              <label>{{ messages.tradeModal.note }}</label>
              <textarea
                v-model="form.note"
                rows="2"
                :placeholder="messages.tradeModal.notePlaceholder"
              />
            </div>
            <div class="actions">
              <div class="hint">
                <p>
                  {{ messages.tradeModal.summary.spread }}:
                  <strong>{{ formatGold(derived.spread) }}</strong>
                   {{ messages.tradeModal.summary.profit }}:
                  <strong>{{ formatGold(derived.profit) }}</strong>
                   {{ messages.tradeModal.summary.realProfit }}:
                  <strong>{{ formatGold(derived.realProfit) }}</strong>
                </p>
                <p class="helper">
                  {{ messages.tradeModal.summary.hint }}
                </p>
              </div>
              <button class="primary" type="submit" :disabled="saving">
                {{
                  saving
                    ? messages.tradeModal.summary.saveLoading
                    : editingTradeId
                      ? messages.tradeModal.summary.saveEdit
                      : messages.tradeModal.summary.saveNew
                }}
              </button>
            </div>
          </form>
          <div class="metrics">
            <div class="metric">
              <p>{{ messages.tradeModal.metrics.spread }}</p>
              <strong>{{ formatGold(derived.spread) }}</strong>
            </div>
            <div class="metric">
              <p>{{ messages.tradeModal.metrics.buyValue }}</p>
              <strong>{{ formatGold(derived.buyTradeValue) }}</strong>
              <span>
                {{
                  t("tradeModal.metrics.buyFeeHint", {
                    units: formatUnits(form.buyUnits),
                    fee: (derived.buyFee * 100).toFixed(2),
                  })
                }}
              </span>
            </div>
            <div class="metric">
              <p>{{ messages.tradeModal.metrics.tradeValue }}</p>
              <strong>{{ formatGold(derived.tradeValue) }}</strong>
              <span>
                {{
                  t("tradeModal.metrics.sellFeeHint", {
                    units: formatUnits(form.sellUnits),
                    fee: (derived.sellFee * 100).toFixed(2),
                  })
                }}
              </span>
            </div>
            <div class="metric">
              <p>{{ messages.tradeModal.metrics.totalFees }}</p>
              <strong>{{ formatGold(derived.cumulativeFees ?? derived.totalFees) }}</strong>
              <span>{{ messages.tradeModal.metrics.totalFeesHint }}</span>
            </div>
            <div class="metric">
              <p>{{ messages.tradeModal.metrics.profit }}</p>
              <strong>{{ formatGold(derived.profit) }}</strong>
              <span>{{ messages.tradeModal.metrics.profitHint }}</span>
            </div>
            <div
              class="metric highlight"
              :class="{
                'is-negative': derived.realProfit < 0,
                'is-positive': derived.realProfit >= 0,
              }"
            >
              <p>{{ messages.tradeModal.metrics.realProfit }}</p>
              <strong>{{ formatGold(derived.realProfit) }}</strong>
              <span>{{ messages.tradeModal.metrics.realProfitHint }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
