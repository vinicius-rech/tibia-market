<script setup lang="ts">
import { computed } from "vue";
import type { Trade } from "~/types/trade";

const props = defineProps<{
  showTrades: boolean;
  items: string[];
  selectedListItem: string;
  filteredListTrades: Trade[];
  hasTrades: boolean;
  loading: boolean;
  formatGold: (value: number) => string;
  formatUnits: (value: number) => string;
  formatPercent: (value: number) => string;
  describeParent: (trade: Trade) => string;
}>();

const emit = defineEmits<{
  (event: "update:showTrades", value: boolean): void;
  (event: "update:selectedListItem", value: string): void;
  (event: "prefill-undercut", trade: Trade): void;
  (event: "edit", trade: Trade): void;
  (event: "delete", tradeId: number): void;
}>();

const open = computed({
  get: () => props.showTrades,
  set: (value: boolean) => emit("update:showTrades", value),
});

const selection = computed({
  get: () => props.selectedListItem,
  set: (value: string) => emit("update:selectedListItem", value),
});
</script>

<template>
  <section class="panel trades">
    <div class="panel__header">
      <div class="panel__header__title">
        <p class="eyebrow">Ordens</p>
        <div class="panel__title-row">
          <h2>Historico</h2>
          <button
            class="panel__toggle"
            type="button"
            :aria-pressed="open"
            :title="open ? 'Recolher historico' : 'Expandir historico'"
            @click="open = !open"
          >
            <svg
              class="panel__toggle-icon"
              viewBox="0 0 20 20"
              aria-hidden="true"
              :class="{ 'is-open': open }"
            >
              <path
                d="M5 7l5 6 5-6"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
              />
            </svg>
            <span>{{ open ? "Esconder" : "Mostrar" }}</span>
          </button>
        </div>
      </div>
      <div class="panel__actions">
        <select v-model="selection">
          <option value="">Todos os itens</option>
          <option v-for="item in items" :key="item" :value="item">
            {{ item }}
          </option>
        </select>
      </div>
    </div>
    <div v-if="open" class="panel__body">
      <p v-if="loading">Carregando...</p>
      <p v-else-if="!hasTrades">Nenhuma ordem cadastrada.</p>
      <p v-else-if="filteredListTrades.length === 0">Nenhuma ordem para o filtro selecionado.</p>
      <div v-else class="trade-list">
        <article
          v-for="trade in filteredListTrades"
          :key="trade.id"
          class="trade-card"
        >
          <header class="trade-card__header">
            <div>
              <p class="eyebrow">
                #{{ trade.id }} · {{ trade.item }}
              </p>
              <h3>{{ describeParent(trade) }}</h3>
            </div>
            <div class="card-actions">
              <button class="ghost" type="button" @click="emit('prefill-undercut', trade)">
                Criar undercut
              </button>
              <button class="ghost" type="button" @click="emit('edit', trade)">
                Editar
              </button>
              <button class="danger" type="button" @click="emit('delete', trade.id)">
                Deletar
              </button>
            </div>
          </header>
          <div class="trade-card__grid">
            <div class="cell">
              <p>
                <span style="color: green">Bid</span> /
                <span style="color: red">Ask</span>
              </p>
              <strong>
                {{ formatGold(trade.bid) }} /
                {{ formatGold(trade.ask) }}
              </strong>
              <span>Spread: {{ formatGold(trade.spread) }}</span>
            </div>
            <div class="cell">
              <p>Buy order</p>
              <strong>{{ formatGold(trade.buyTradeValue) }}</strong>
              <span>
                {{ formatUnits(trade.buyUnits) }} un · fee {{ formatPercent(trade.buyFee) }}
              </span>
            </div>
            <div class="cell">
              <p>Sell order</p>
              <strong>{{ formatGold(trade.tradeValue) }}</strong>
              <span>
                {{ formatUnits(trade.sellUnits) }} un · fee
                {{ formatPercent(trade.sellFee) }}
              </span>
            </div>
            <div class="cell">
              <p>Fees</p>
              <strong>{{ formatGold(trade.cumulativeFees) }}</strong>
              <span>Herdadas: {{ formatGold(trade.inheritedFees) }}</span>
            </div>
            <div class="cell">
              <p>Registrado</p>
              <strong>{{ new Date(trade.createdAt).toLocaleString("pt-BR") }}</strong>
              <span v-if="trade.note">{{ trade.note }}</span>
            </div>
            <div
              class="cell real-profit-cell"
              :class="{
                'is-negative': trade.realProfit < 0,
                'is-positive': trade.realProfit >= 0,
              }"
            >
              <p>Real Profit</p>
              <strong>{{ formatGold(trade.realProfit) }}</strong>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
