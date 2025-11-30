<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  showTotals: boolean;
  items: string[];
  selectedTotalsItem: string;
  totalsSnapshot: {
    totalValue: number;
    totalFees: number;
    totalRealProfit: number;
    undercuts: number;
    count: number;
  };
  hasTrades: boolean;
  hasFilteredTrades: boolean;
  formatGold: (value: number) => string;
  formatUnits: (value: number) => string;
}>();

const emit = defineEmits<{
  (event: "update:showTotals", value: boolean): void;
  (event: "update:selectedTotalsItem", value: string): void;
}>();

const open = computed({
  get: () => props.showTotals,
  set: (value: boolean) => emit("update:showTotals", value),
});

const selection = computed({
  get: () => props.selectedTotalsItem,
  set: (value: string) => emit("update:selectedTotalsItem", value),
});
</script>

<template>
  <section class="panel totals">
    <div class="panel__header">
      <div class="panel__header__title">
        <p class="eyebrow">Resumo</p>
        <div class="panel__title-row">
          <h2>Totais consolidados</h2>
          <button
            class="panel__toggle"
            type="button"
            :aria-pressed="open"
            :title="open ? 'Recolher painel de totais' : 'Expandir painel de totais'"
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
      <p v-if="!props.hasTrades" class="helper">
        Cadastre ordens para ver os totais consolidados.
      </p>
      <p v-else-if="!props.hasFilteredTrades" class="helper">
        Nenhuma ordem encontrada para este filtro.
      </p>
      <div v-else class="totals-grid">
        <article class="total-card">
          <p class="total-card__label">Valor vendido</p>
          <p class="total-card__value">
            {{ formatGold(props.totalsSnapshot.totalValue) }}
          </p>
          <p class="total-card__meta">
            Soma de trade value das ordens filtradas.
          </p>
        </article>
        <article class="total-card">
          <p class="total-card__label">Taxas pagas</p>
          <p class="total-card__value">
            {{ formatGold(props.totalsSnapshot.totalFees) }}
          </p>
          <p class="total-card__meta">
            All time (taxas diretas e herdadas).
          </p>
        </article>
        <article
          class="total-card"
          :class="
            props.totalsSnapshot.totalRealProfit >= 0
              ? 'total-card--positive'
              : 'total-card--negative'
          "
        >
          <p class="total-card__label">Real profit</p>
          <p class="total-card__value">
            {{ formatGold(props.totalsSnapshot.totalRealProfit) }}
          </p>
          <p class="total-card__meta">Lucro liquido acumulado.</p>
        </article>
        <article class="total-card total-card--neutral">
          <p class="total-card__label">Undercuts</p>
          <p class="total-card__value">
            {{ formatUnits(props.totalsSnapshot.undercuts) }}
          </p>
          <p class="total-card__meta">
            Ordens com referencia de undercut.
          </p>
        </article>
        <article class="total-card total-card--neutral">
          <p class="total-card__label">Trades</p>
          <p class="total-card__value">
            {{ formatUnits(props.totalsSnapshot.count) }}
          </p>
          <p class="total-card__meta">
            Quantidade total do filtro.
          </p>
        </article>
      </div>
    </div>
  </section>
</template>
