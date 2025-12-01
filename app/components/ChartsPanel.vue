<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "~/composables/useI18n";

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

const { messages } = useI18n();
</script>

<template>
  <section class="panel charts">
    <div class="panel__header">
      <div class="panel__header__title">
        <p class="eyebrow">{{ messages.charts.eyebrow }}</p>
        <div class="panel__title-row">
          <h2>{{ messages.charts.title }}</h2>
          <button
            class="panel__toggle"
            type="button"
            :aria-pressed="open"
            :title="open ? messages.charts.collapseTitle : messages.charts.expandTitle"
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
            <span>{{ open ? messages.common.hide : messages.common.show }}</span>
          </button>
        </div>
      </div>
      <div class="panel__actions">
        <label class="label-with-icon" for="chartsFilter">
          <span>{{ messages.charts.filterLabel }}</span>
          <span
            class="info-icon"
            role="img"
            :title="messages.charts.filterHelp"
            :aria-label="messages.charts.filterHelp"
          >
            ?
          </span>
        </label>
        <select id="chartsFilter" v-model="selection" :aria-label="messages.charts.filterLabel">
          <option value="">{{ messages.common.allItems }}</option>
          <option v-for="item in items" :key="item" :value="item">
            {{ item }}
          </option>
        </select>
      </div>
    </div>
    <div v-if="open" class="panel__body">
      <p v-if="tradesLength === 0" class="helper">
        {{ messages.charts.empty }}
      </p>
      <div v-else class="charts-grid">
        <article class="chart-card">
          <div class="chart-card__header">
            <p class="label-with-icon">
              <span>{{ messages.charts.cards.profit }}</span>
              <span
                class="info-icon"
                role="img"
                :title="messages.charts.cardsHints.profit"
                :aria-label="messages.charts.cardsHints.profit"
              >
                ?
              </span>
            </p>
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
            <p class="label-with-icon">
              <span>{{ messages.charts.cards.spread }}</span>
              <span
                class="info-icon"
                role="img"
                :title="messages.charts.cardsHints.spread"
                :aria-label="messages.charts.cardsHints.spread"
              >
                ?
              </span>
            </p>
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
            <p class="label-with-icon">
              <span>{{ messages.charts.cards.buyValue }}</span>
              <span
                class="info-icon"
                role="img"
                :title="messages.charts.cardsHints.buyValue"
                :aria-label="messages.charts.cardsHints.buyValue"
              >
                ?
              </span>
            </p>
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
            <p class="label-with-icon">
              <span>{{ messages.charts.cards.sellValue }}</span>
              <span
                class="info-icon"
                role="img"
                :title="messages.charts.cardsHints.sellValue"
                :aria-label="messages.charts.cardsHints.sellValue"
              >
                ?
              </span>
            </p>
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
            <p class="label-with-icon">
              <span>{{ messages.charts.cards.fees }}</span>
              <span
                class="info-icon"
                role="img"
                :title="messages.charts.cardsHints.fees"
                :aria-label="messages.charts.cardsHints.fees"
              >
                ?
              </span>
            </p>
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
            <p class="label-with-icon">
              <span>{{ messages.charts.cards.units }}</span>
              <span
                class="info-icon"
                role="img"
                :title="messages.charts.cardsHints.units"
                :aria-label="messages.charts.cardsHints.units"
              >
                ?
              </span>
            </p>
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
