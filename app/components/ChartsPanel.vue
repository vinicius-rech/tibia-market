<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  showCharts: boolean;
  items: string[];
  selectedChartItem: string;
  tradesLength: number;
  chartSeries: Record<string, number[]>;
  chartStats: Record<string, { latest: number; delta: number }>;
  buildSparkPath: (values: number[]) => string;
  formatGold: (value: number) => string;
  formatUnits: (value: number) => string;
}>();

const emit = defineEmits<{
  (event: "update:showCharts", value: boolean): void;
  (event: "update:selectedChartItem", value: string): void;
}>();

const open = computed({
  get: () => props.showCharts,
  set: (value: boolean) => emit("update:showCharts", value),
});

const selection = computed({
  get: () => props.selectedChartItem,
  set: (value: string) => emit("update:selectedChartItem", value),
});
</script>

<template>
  <section class="panel charts">
    <div class="panel__header">
      <div class="panel__header__title">
        <p class="eyebrow">Insights</p>
        <div class="panel__title-row">
          <h2>Graficos rapidos</h2>
          <button
            class="panel__toggle"
            type="button"
            :aria-pressed="open"
            :title="open ? 'Recolher graficos' : 'Expandir graficos'"
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
      <p v-if="tradesLength === 0" class="helper">
        Cadastre ordens para visualizar historico e tendencias.
      </p>
      <div v-else class="charts-grid">
        <article class="chart-card">
          <div class="chart-card__header">
            <p>Real profit</p>
            <strong>{{ formatGold(props.chartStats.profit.latest) }}</strong>
            <span
              :class="{
                positive: props.chartStats.profit.delta >= 0,
                negative: props.chartStats.profit.delta < 0,
              }"
            >
              {{ formatGold(props.chartStats.profit.delta) }}
            </span>
          </div>
          <svg class="sparkline" viewBox="0 0 160 80" preserveAspectRatio="none">
            <path class="sparkline__stroke" :d="buildSparkPath(props.chartSeries.profit)" />
          </svg>
        </article>
        <article class="chart-card">
          <div class="chart-card__header">
            <p>Spread</p>
            <strong>{{ formatGold(props.chartStats.spread.latest) }}</strong>
            <span
              :class="{
                positive: props.chartStats.spread.delta >= 0,
                negative: props.chartStats.spread.delta < 0,
              }"
            >
              {{ formatGold(props.chartStats.spread.delta) }}
            </span>
          </div>
          <svg class="sparkline" viewBox="0 0 160 80" preserveAspectRatio="none">
            <path class="sparkline__stroke" :d="buildSparkPath(props.chartSeries.spread)" />
          </svg>
        </article>
        <article class="chart-card">
          <div class="chart-card__header">
            <p>Valor de compra</p>
            <strong>{{ formatGold(props.chartStats.buyValue.latest) }}</strong>
            <span
              :class="{
                positive: props.chartStats.buyValue.delta >= 0,
                negative: props.chartStats.buyValue.delta < 0,
              }"
            >
              {{ formatGold(props.chartStats.buyValue.delta) }}
            </span>
          </div>
          <svg class="sparkline" viewBox="0 0 160 80" preserveAspectRatio="none">
            <path class="sparkline__stroke" :d="buildSparkPath(props.chartSeries.buyValue)" />
          </svg>
        </article>
        <article class="chart-card">
          <div class="chart-card__header">
            <p>Valor de venda</p>
            <strong>{{ formatGold(props.chartStats.sellValue.latest) }}</strong>
            <span
              :class="{
                positive: props.chartStats.sellValue.delta >= 0,
                negative: props.chartStats.sellValue.delta < 0,
              }"
            >
              {{ formatGold(props.chartStats.sellValue.delta) }}
            </span>
          </div>
          <svg class="sparkline" viewBox="0 0 160 80" preserveAspectRatio="none">
            <path class="sparkline__stroke" :d="buildSparkPath(props.chartSeries.sellValue)" />
          </svg>
        </article>
        <article class="chart-card">
          <div class="chart-card__header">
            <p>Taxas</p>
            <strong>{{ formatGold(props.chartStats.fees.latest) }}</strong>
            <span
              :class="{
                positive: props.chartStats.fees.delta >= 0,
                negative: props.chartStats.fees.delta < 0,
              }"
            >
              {{ formatGold(props.chartStats.fees.delta) }}
            </span>
          </div>
          <svg class="sparkline" viewBox="0 0 160 80" preserveAspectRatio="none">
            <path class="sparkline__stroke" :d="buildSparkPath(props.chartSeries.fees)" />
          </svg>
        </article>
        <article class="chart-card">
          <div class="chart-card__header">
            <p>Unidades totais</p>
            <strong>{{ formatUnits(props.chartStats.units.latest) }}</strong>
            <span
              :class="{
                positive: props.chartStats.units.delta >= 0,
                negative: props.chartStats.units.delta < 0,
              }"
            >
              {{ formatUnits(Math.round(props.chartStats.units.delta)) }}
            </span>
          </div>
          <svg class="sparkline" viewBox="0 0 160 80" preserveAspectRatio="none">
            <path class="sparkline__stroke" :d="buildSparkPath(props.chartSeries.units)" />
          </svg>
        </article>
      </div>
    </div>
  </section>
</template>
