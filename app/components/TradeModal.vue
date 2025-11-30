<script setup lang="ts">
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
</script>

<template>
  <div
    v-if="show"
    class="modal-backdrop"
    @click.self="emit('close')"
  >
    <div class="modal modal--wide">
      <div class="modal__header">
        <div>
          <p class="eyebrow">
            {{ editingTradeId ? `Editar ordem #${editingTradeId}` : "Nova ordem" }}
          </p>
          <h3>{{ form.item || "Defina o item" }}</h3>
        </div>
        <div class="panel__actions">
          <button
            v-if="form.item"
            class="ghost inline"
            type="button"
            :disabled="!canRegisterItem"
            @click="onRegisterItem"
          >
            Cadastrar "{{ form.item.trim() }}"
          </button>
          <button
            class="ghost"
            type="button"
            @click="emit('close')"
          >
            Fechar
          </button>
        </div>
      </div>
      <div class="modal__body">
        <div class="grid">
          <form class="form" @submit.prevent="onSubmit">
            <div class="field">
              <label for="item">Item</label>
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
              <p class="helper">Use setas ou Tab para completar sugestoes.</p>
            </div>
            <div class="field two-col">
              <div>
                <label>Bid (compra)</label>
                <input v-model.number="form.bid" type="number" min="0" step="1" required />
              </div>
              <div>
                <label>Ask (venda)</label>
                <input v-model.number="form.ask" type="number" min="0" step="1" required />
              </div>
            </div>
            <div class="field two-col">
              <div>
                <label>Buy units</label>
                <input v-model.number="form.buyUnits" type="number" min="0" step="1" required />
              </div>
              <div>
                <label>Sell units</label>
                <input v-model.number="form.sellUnits" type="number" min="0" step="1" required />
              </div>
            </div>
            <div class="field">
              <label>Undercut (opcional)</label>
              <select v-model.number="form.parentTradeId">
                <option :value="null">Sem undercut</option>
                <option
                  v-for="trade in trades"
                  :key="trade.id"
                  :value="trade.id"
                  :disabled="editingTradeId === trade.id"
                >
                  #{{ trade.id }} · {{ trade.item }} · taxas herdadas:
                  {{ formatGold(trade.cumulativeFees) }}
                </option>
              </select>
              <p class="helper">
                Selecione uma ordem para encadear um undercut e trazer as taxas acumuladas para o lucro real.
              </p>
            </div>
            <div class="field">
              <label>Duplicar ordens (quantidade)</label>
              <input
                v-model.number="form.duplicationCount"
                type="number"
                min="1"
                :max="maxDuplications"
                step="1"
                :disabled="!!editingTradeId"
              />
              <p class="helper">
                Cria copias independentes ao salvar a ordem. Ignorado ao editar. Limite de
                {{ maxDuplications }} copias.
              </p>
            </div>
            <div class="field">
              <label>Observacao</label>
              <textarea
                v-model="form.note"
                rows="2"
                placeholder="Ex: relistado apos undercut, ajuste de preco, etc"
              />
            </div>
            <div class="actions">
              <div class="hint">
                <p>
                  Spread:
                  <strong>{{ formatGold(derived.spread) }}</strong>
                  · Profit:
                  <strong>{{ formatGold(derived.profit) }}</strong>
                  · Real profit:
                  <strong>{{ formatGold(derived.realProfit) }}</strong>
                </p>
                <p class="helper">
                  Real profit considera todas as taxas herdadas do encadeamento.
                </p>
              </div>
              <button class="primary" type="submit" :disabled="saving">
                {{
                  saving
                    ? "Salvando..."
                    : editingTradeId
                      ? "Salvar edicao"
                      : "Salvar ordem"
                }}
              </button>
            </div>
          </form>
          <div class="metrics">
            <div class="metric">
              <p>Spread</p>
              <strong>{{ formatGold(derived.spread) }}</strong>
            </div>
            <div class="metric">
              <p>Buy trade value</p>
              <strong>{{ formatGold(derived.buyTradeValue) }}</strong>
              <span>
                {{ formatUnits(form.buyUnits) }} un · fee {{ derived.buyFee * 100 }}%
              </span>
            </div>
            <div class="metric">
              <p>Trade value</p>
              <strong>{{ formatGold(derived.tradeValue) }}</strong>
              <span>
                {{ formatUnits(form.sellUnits) }} un · fee {{ derived.sellFee * 100 }}%
              </span>
            </div>
            <div class="metric">
              <p>Total fees</p>
              <strong>{{ derived.cumulativeFees ?? derived.totalFees }}</strong>
              <span>Inclui compra + venda</span>
            </div>
            <div class="metric">
              <p>Profit</p>
              <strong>{{ formatGold(derived.profit) }}</strong>
              <span>Lucro bruto (antes das taxas)</span>
            </div>
            <div
              class="metric highlight"
              :class="{
                'is-negative': derived.realProfit < 0,
                'is-positive': derived.realProfit >= 0,
              }"
            >
              <p>Real profit</p>
              <strong>{{ formatGold(derived.realProfit) }}</strong>
              <span>Lucro liquido (taxas + herdadas)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
