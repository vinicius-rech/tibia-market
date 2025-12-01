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
              <label for="item" class="label-with-icon">
                <span>{{ messages.tradeModal.itemLabel }}</span>
                <span
                  class="info-icon"
                  role="img"
                  :title="messages.tradeModal.fieldHelp.item"
                  :aria-label="messages.tradeModal.fieldHelp.item"
                >
                  ?
                </span>
              </label>
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
                <label class="label-with-icon">
                  <span>{{ messages.tradeModal.bid }}</span>
                  <span
                    class="info-icon"
                    role="img"
                    :title="messages.tradeModal.fieldHelp.bid"
                    :aria-label="messages.tradeModal.fieldHelp.bid"
                  >
                    ?
                  </span>
                </label>
                <input v-model.number="form.bid" type="number" min="0" step="1" required />
              </div>
              <div>
                <label class="label-with-icon">
                  <span>{{ messages.tradeModal.ask }}</span>
                  <span
                    class="info-icon"
                    role="img"
                    :title="messages.tradeModal.fieldHelp.ask"
                    :aria-label="messages.tradeModal.fieldHelp.ask"
                  >
                    ?
                  </span>
                </label>
                <input v-model.number="form.ask" type="number" min="0" step="1" required />
              </div>
            </div>
            <div class="field two-col">
              <div>
                <label class="label-with-icon">
                  <span>{{ messages.tradeModal.buyUnits }}</span>
                  <span
                    class="info-icon"
                    role="img"
                    :title="messages.tradeModal.fieldHelp.buyUnits"
                    :aria-label="messages.tradeModal.fieldHelp.buyUnits"
                  >
                    ?
                  </span>
                </label>
                <input v-model.number="form.buyUnits" type="number" min="0" step="1" required />
              </div>
              <div>
                <label class="label-with-icon">
                  <span>{{ messages.tradeModal.sellUnits }}</span>
                  <span
                    class="info-icon"
                    role="img"
                    :title="messages.tradeModal.fieldHelp.sellUnits"
                    :aria-label="messages.tradeModal.fieldHelp.sellUnits"
                  >
                    ?
                  </span>
                </label>
                <input v-model.number="form.sellUnits" type="number" min="0" step="1" required />
              </div>
            </div>
            <div class="field">
              <label class="label-with-icon">
                <span>{{ messages.tradeModal.undercut }}</span>
                <span
                  class="info-icon"
                  role="img"
                  :title="messages.tradeModal.fieldHelp.undercut"
                  :aria-label="messages.tradeModal.fieldHelp.undercut"
                >
                  ?
                </span>
              </label>
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
              <label class="label-with-icon">
                <span>{{ messages.tradeModal.duplicateLabel }}</span>
                <span
                  class="info-icon"
                  role="img"
                  :title="messages.tradeModal.fieldHelp.duplicate"
                  :aria-label="messages.tradeModal.fieldHelp.duplicate"
                >
                  ?
                </span>
              </label>
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
              <label class="label-with-icon">
                <span>{{ messages.tradeModal.note }}</span>
                <span
                  class="info-icon"
                  role="img"
                  :title="messages.tradeModal.fieldHelp.note"
                  :aria-label="messages.tradeModal.fieldHelp.note"
                >
                  ?
                </span>
              </label>
              <textarea
                v-model="form.note"
                rows="2"
                :placeholder="messages.tradeModal.notePlaceholder"
              />
            </div>
            <div class="actions">
              <div class="hint">
                <p>
                  <span class="label-with-icon">
                    <span>{{ messages.tradeModal.summary.spread }}:</span>
                    <span
                      class="info-icon"
                      role="img"
                      :title="messages.tradeModal.summary.tooltips.spread"
                      :aria-label="messages.tradeModal.summary.tooltips.spread"
                    >
                      ?
                    </span>
                  </span>
                  <strong>{{ formatGold(derived.spread) }}</strong>
                  &nbsp;
                  <span class="label-with-icon">
                    <span>{{ messages.tradeModal.summary.profit }}:</span>
                    <span
                      class="info-icon"
                      role="img"
                      :title="messages.tradeModal.summary.tooltips.profit"
                      :aria-label="messages.tradeModal.summary.tooltips.profit"
                    >
                      ?
                    </span>
                  </span>
                  <strong>{{ formatGold(derived.profit) }}</strong>
                  &nbsp;
                  <span class="label-with-icon">
                    <span>{{ messages.tradeModal.summary.realProfit }}:</span>
                    <span
                      class="info-icon"
                      role="img"
                      :title="messages.tradeModal.summary.tooltips.realProfit"
                      :aria-label="messages.tradeModal.summary.tooltips.realProfit"
                    >
                      ?
                    </span>
                  </span>
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
              <p class="label-with-icon">
                <span>{{ messages.tradeModal.metrics.spread }}</span>
                <span
                  class="info-icon"
                  role="img"
                  :title="messages.tradeModal.metrics.spreadHint"
                  :aria-label="messages.tradeModal.metrics.spreadHint"
                >
                  ?
                </span>
              </p>
              <strong>{{ formatGold(derived.spread) }}</strong>
              <span>{{ messages.tradeModal.metrics.spreadHint }}</span>
            </div>
            <div class="metric">
              <p class="label-with-icon">
                <span>{{ messages.tradeModal.metrics.buyValue }}</span>
                <span
                  class="info-icon"
                  role="img"
                  :title="
                    t('tradeModal.metrics.buyFeeHint', {
                      units: formatUnits(form.buyUnits),
                      fee: (derived.buyFee * 100).toFixed(2),
                    })
                  "
                  :aria-label="
                    t('tradeModal.metrics.buyFeeHint', {
                      units: formatUnits(form.buyUnits),
                      fee: (derived.buyFee * 100).toFixed(2),
                    })
                  "
                >
                  ?
                </span>
              </p>
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
              <p class="label-with-icon">
                <span>{{ messages.tradeModal.metrics.tradeValue }}</span>
                <span
                  class="info-icon"
                  role="img"
                  :title="
                    t('tradeModal.metrics.sellFeeHint', {
                      units: formatUnits(form.sellUnits),
                      fee: (derived.sellFee * 100).toFixed(2),
                    })
                  "
                  :aria-label="
                    t('tradeModal.metrics.sellFeeHint', {
                      units: formatUnits(form.sellUnits),
                      fee: (derived.sellFee * 100).toFixed(2),
                    })
                  "
                >
                  ?
                </span>
              </p>
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
              <p class="label-with-icon">
                <span>{{ messages.tradeModal.metrics.totalFees }}</span>
                <span
                  class="info-icon"
                  role="img"
                  :title="messages.tradeModal.metrics.totalFeesHint"
                  :aria-label="messages.tradeModal.metrics.totalFeesHint"
                >
                  ?
                </span>
              </p>
              <strong>{{ formatGold(derived.cumulativeFees ?? derived.totalFees) }}</strong>
              <span>{{ messages.tradeModal.metrics.totalFeesHint }}</span>
            </div>
            <div class="metric">
              <p class="label-with-icon">
                <span>{{ messages.tradeModal.metrics.profit }}</span>
                <span
                  class="info-icon"
                  role="img"
                  :title="messages.tradeModal.metrics.profitHint"
                  :aria-label="messages.tradeModal.metrics.profitHint"
                >
                  ?
                </span>
              </p>
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
              <p class="label-with-icon">
                <span>{{ messages.tradeModal.metrics.realProfit }}</span>
                <span
                  class="info-icon"
                  role="img"
                  :title="messages.tradeModal.metrics.realProfitHint"
                  :aria-label="messages.tradeModal.metrics.realProfitHint"
                >
                  ?
                </span>
              </p>
              <strong>{{ formatGold(derived.realProfit) }}</strong>
              <span>{{ messages.tradeModal.metrics.realProfitHint }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
