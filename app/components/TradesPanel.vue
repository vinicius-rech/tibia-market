<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "~/composables/useI18n";
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

const { messages, locale, t } = useI18n();
</script>

<template>
  <section class="panel trades">
    <div class="panel__header">
      <div class="panel__header__title">
        <p class="eyebrow">{{ messages.tradesPanel.eyebrow }}</p>
        <div class="panel__title-row">
          <h2>{{ messages.tradesPanel.title }}</h2>
          <button
            class="panel__toggle"
            type="button"
            :aria-pressed="open"
            :title="open ? messages.tradesPanel.collapseTitle : messages.tradesPanel.expandTitle"
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
        <label class="label-with-icon" for="tradesFilter">
          <span>{{ messages.tradesPanel.filterLabel }}</span>
          <span
            class="info-icon"
            role="img"
            :title="messages.tradesPanel.filterHelp"
            :aria-label="messages.tradesPanel.filterHelp"
          >
            ?
          </span>
        </label>
        <select id="tradesFilter" v-model="selection" :aria-label="messages.tradesPanel.filterLabel">
          <option value="">{{ messages.common.allItems }}</option>
          <option v-for="item in items" :key="item" :value="item">
            {{ item }}
          </option>
        </select>
      </div>
    </div>
    <div v-if="open" class="panel__body">
      <p v-if="loading">{{ messages.tradesPanel.loading }}</p>
      <p v-else-if="!hasTrades">{{ messages.tradesPanel.empty }}</p>
      <p v-else-if="filteredListTrades.length === 0">
        {{ messages.tradesPanel.emptyFiltered }}
      </p>
      <div v-else class="trade-list">
        <article
          v-for="trade in filteredListTrades"
          :key="trade.id"
          class="trade-card"
        >
          <header class="trade-card__header">
            <div>
              <p class="eyebrow">
                #{{ trade.id }} {{ trade.item }}
              </p>
              <h3>{{ describeParent(trade) }}</h3>
            </div>
            <div class="card-actions">
              <button class="ghost" type="button" @click="emit('prefill-undercut', trade)">
                {{ messages.tradesPanel.actions.undercut }}
              </button>
              <button class="ghost" type="button" @click="emit('edit', trade)">
                {{ messages.tradesPanel.actions.edit }}
              </button>
              <button class="danger" type="button" @click="emit('delete', trade.id)">
                {{ messages.tradesPanel.actions.delete }}
              </button>
            </div>
          </header>
          <div class="trade-card__grid">
            <div class="cell">
              <p class="label-with-icon">
                <span>{{ messages.tradesPanel.card.bidAsk }}</span>
                <span
                  class="info-icon"
                  role="img"
                  :title="messages.tradesPanel.cardHelp.bidAsk"
                  :aria-label="messages.tradesPanel.cardHelp.bidAsk"
                >
                  ?
                </span>
              </p>
              <strong>
                {{ formatGold(trade.bid) }} /
                {{ formatGold(trade.ask) }}
              </strong>
              <span>{{ messages.tradesPanel.card.spread }}: {{ formatGold(trade.spread) }}</span>
            </div>
            <div class="cell">
              <p class="label-with-icon">
                <span>{{ messages.tradesPanel.card.buyOrder }}</span>
                <span
                  class="info-icon"
                  role="img"
                  :title="messages.tradesPanel.cardHelp.buyOrder"
                  :aria-label="messages.tradesPanel.cardHelp.buyOrder"
                >
                  ?
                </span>
              </p>
              <strong>{{ formatGold(trade.buyTradeValue) }}</strong>
              <span>
                {{
                  t("tradesPanel.card.unitFee", {
                    units: formatUnits(trade.buyUnits),
                    fee: formatPercent(trade.buyFee),
                  })
                }}
              </span>
            </div>
            <div class="cell">
              <p class="label-with-icon">
                <span>{{ messages.tradesPanel.card.sellOrder }}</span>
                <span
                  class="info-icon"
                  role="img"
                  :title="messages.tradesPanel.cardHelp.sellOrder"
                  :aria-label="messages.tradesPanel.cardHelp.sellOrder"
                >
                  ?
                </span>
              </p>
              <strong>{{ formatGold(trade.tradeValue) }}</strong>
              <span>
                {{
                  t("tradesPanel.card.unitFee", {
                    units: formatUnits(trade.sellUnits),
                    fee: formatPercent(trade.sellFee),
                  })
                }}
              </span>
            </div>
            <div class="cell">
              <p class="label-with-icon">
                <span>{{ messages.tradesPanel.card.fees }}</span>
                <span
                  class="info-icon"
                  role="img"
                  :title="messages.tradesPanel.cardHelp.fees"
                  :aria-label="messages.tradesPanel.cardHelp.fees"
                >
                  ?
                </span>
              </p>
              <strong>{{ formatGold(trade.cumulativeFees) }}</strong>
              <span>{{ messages.tradesPanel.card.inherited }}: {{ formatGold(trade.inheritedFees) }}</span>
            </div>
            <div class="cell">
              <p class="label-with-icon">
                <span>{{ messages.tradesPanel.card.recorded }}</span>
                <span
                  class="info-icon"
                  role="img"
                  :title="messages.tradesPanel.cardHelp.recorded"
                  :aria-label="messages.tradesPanel.cardHelp.recorded"
                >
                  ?
                </span>
              </p>
              <strong>{{ new Date(trade.createdAt).toLocaleString(locale === "pt" ? "pt-BR" : "en-US") }}</strong>
              <span v-if="trade.note">{{ trade.note }}</span>
            </div>
            <div
              class="cell real-profit-cell"
              :class="{
                'is-negative': trade.realProfit < 0,
                'is-positive': trade.realProfit >= 0,
              }"
            >
              <p class="label-with-icon">
                <span>{{ messages.tradesPanel.card.realProfit }}</span>
                <span
                  class="info-icon"
                  role="img"
                  :title="messages.tradesPanel.cardHelp.realProfit"
                  :aria-label="messages.tradesPanel.cardHelp.realProfit"
                >
                  ?
                </span>
              </p>
              <strong>{{ formatGold(trade.realProfit) }}</strong>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
