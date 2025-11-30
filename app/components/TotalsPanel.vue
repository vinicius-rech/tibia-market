<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "~/composables/useI18n";

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

const { messages } = useI18n();
</script>

<template>
  <section class="panel totals">
    <div class="panel__header">
      <div class="panel__header__title">
        <p class="eyebrow">{{ messages.totals.eyebrow }}</p>
        <div class="panel__title-row">
          <h2>{{ messages.totals.title }}</h2>
          <button
            class="panel__toggle"
            type="button"
            :aria-pressed="open"
            :title="open ? messages.totals.collapseTitle : messages.totals.expandTitle"
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
        <select v-model="selection">
          <option value="">{{ messages.common.allItems }}</option>
          <option v-for="item in items" :key="item" :value="item">
            {{ item }}
          </option>
        </select>
      </div>
    </div>
    <div v-if="open" class="panel__body">
      <p v-if="!props.hasTrades" class="helper">
        {{ messages.totals.noTrades }}
      </p>
      <p v-else-if="!props.hasFilteredTrades" class="helper">
        {{ messages.totals.noFiltered }}
      </p>
      <div v-else class="totals-grid">
        <article class="total-card">
          <p class="total-card__label">{{ messages.totals.value.label }}</p>
          <p class="total-card__value">
            {{ formatGold(props.totalsSnapshot.totalValue) }}
          </p>
          <p class="total-card__meta">
            {{ messages.totals.value.meta }}
          </p>
        </article>
        <article class="total-card">
          <p class="total-card__label">{{ messages.totals.fees.label }}</p>
          <p class="total-card__value">
            {{ formatGold(props.totalsSnapshot.totalFees) }}
          </p>
          <p class="total-card__meta">
            {{ messages.totals.fees.meta }}
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
          <p class="total-card__label">{{ messages.totals.realProfit.label }}</p>
          <p class="total-card__value">
            {{ formatGold(props.totalsSnapshot.totalRealProfit) }}
          </p>
          <p class="total-card__meta">{{ messages.totals.realProfit.meta }}</p>
        </article>
        <article class="total-card total-card--neutral">
          <p class="total-card__label">{{ messages.totals.undercuts.label }}</p>
          <p class="total-card__value">
            {{ formatUnits(props.totalsSnapshot.undercuts) }}
          </p>
          <p class="total-card__meta">
            {{ messages.totals.undercuts.meta }}
          </p>
        </article>
        <article class="total-card total-card--neutral">
          <p class="total-card__label">{{ messages.totals.trades.label }}</p>
          <p class="total-card__value">
            {{ formatUnits(props.totalsSnapshot.count) }}
          </p>
          <p class="total-card__meta">
            {{ messages.totals.trades.meta }}
          </p>
        </article>
      </div>
    </div>
  </section>
</template>
