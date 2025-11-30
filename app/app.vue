<script setup lang="ts">
import { Analytics } from "@vercel/analytics/nuxt";
import AboutPanel from "./components/AboutPanel.vue";
import AppHero from "./components/AppHero.vue";
import BackupModal from "./components/BackupModal.vue";
import ChartsPanel from "./components/ChartsPanel.vue";
import FeeModal from "./components/FeeModal.vue";
import TotalsPanel from "./components/TotalsPanel.vue";
import TradeModal from "./components/TradeModal.vue";
import TradesPanel from "./components/TradesPanel.vue";
import type { ItemRow, Trade, TradeInput, TradeRow } from "./types/trade";

const { $pglite } = useNuxtApp();

const loading = ref(true);
const saving = ref(false);
const error = ref<string | null>(null);
const trades = ref<Trade[]>([]);
const items = ref<string[]>([]);
const editingTradeId = ref<number | null>(null);
const showFeeModal = ref(false);
const showTradeModal = ref(false);
const selectedChartItem = ref("");
const selectedTotalsItem = ref("");
const selectedListItem = ref("");
const globalItemFilter = ref("");
const showAbout = ref(true);
const showTotals = ref(true);
const showCharts = ref(true);
const showTrades = ref(true);
const showBackupModal = ref(false);
const importInput = ref<HTMLInputElement | null>(null);
const globalBuyFeePct = ref(1);
const globalSellFeePct = ref(2);
const showSuggestions = ref(false);
const highlightedSuggestion = ref(0);
const SUGGESTION_LIMIT = 8;
const MAX_DUPLICATIONS = 50;
const VISIBILITY_STORAGE_KEY = "tibia-trader-visibility";
const FILTER_STORAGE_KEY = "tibia-trader-filters";
let hideSuggestionsTimeout: number | null = null;

const filteredTrades = computed(() =>
    filterTradesByItem(trades.value, selectedChartItem.value),
);

const filteredTotalsTrades = computed(() =>
    filterTradesByItem(trades.value, selectedTotalsItem.value),
);

const filteredListTrades = computed(() =>
    filterTradesByItem(trades.value, selectedListItem.value),
);

const chartSeries = computed(() => {
    const ordered = filteredTrades.value.slice().reverse();
    const build = (extractor: (trade: Trade) => number) => {
        if (!ordered.length) return [0];
        const numbers = ordered
            .map((trade) => toNumber(extractor(trade)))
            .filter((value) => Number.isFinite(value));
        return numbers.length ? numbers : [0];
    };

    return {
        profit: build((trade) => trade.realProfit),
        spread: build((trade) => trade.spread),
        buyValue: build((trade) => trade.buyTradeValue),
        sellValue: build((trade) => trade.tradeValue),
        fees: build((trade) => trade.totalFees),
        units: build((trade) => trade.buyUnits + trade.sellUnits),
    };
});

const chartStats = computed(() => ({
    profit: sparkStats(chartSeries.value.profit),
    spread: sparkStats(chartSeries.value.spread),
    buyValue: sparkStats(chartSeries.value.buyValue),
    sellValue: sparkStats(chartSeries.value.sellValue),
    fees: sparkStats(chartSeries.value.fees),
    units: sparkStats(chartSeries.value.units),
}));

const totalsSnapshot = computed(() =>
    filteredTotalsTrades.value.reduce(
        (acc, trade) => {
            acc.totalValue += toNumber(trade.tradeValue);
            acc.totalFees += toNumber(trade.cumulativeFees);
            acc.totalRealProfit += toNumber(trade.realProfit);
            acc.undercuts += trade.parentTradeId ? 1 : 0;
            acc.count += 1;
            return acc;
        },
        {
            totalValue: 0,
            totalFees: 0,
            totalRealProfit: 0,
            undercuts: 0,
            count: 0,
        },
    ),
);

const form = reactive<TradeInput>({
    item: "",
    bid: 0,
    ask: 0,
    buyUnits: 1,
    sellUnits: 1,
    parentTradeId: null,
    note: "",
    duplicationCount: 1,
});

const selectedParentId = computed(() => {
    const rawId = form.parentTradeId;
    const numeric =
        typeof rawId === "number" ? rawId : Number.parseInt(String(rawId), 10);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
});

const parentFee = computed(() => {
    if (!selectedParentId.value) {
        return 0;
    }

    const parent = trades.value.find(
        (trade) => trade.id === selectedParentId.value,
    );
    return parent?.cumulativeFees ?? 0;
});

const itemExists = computed(() => {
    const name = form.item.trim().toLowerCase();
    return items.value.some((stored) => stored.toLowerCase() === name);
});

const canRegisterItem = computed(
    () => form.item.trim().length >= 2 && !itemExists.value,
);

const derived = computed(() =>
    buildMetrics(
        form,
        parentFee.value,
        globalBuyFeePct.value,
        globalSellFeePct.value,
    ),
);

const filteredItems = computed(() => {
    const term = form.item.trim().toLowerCase();
    if (!term) {
        return items.value
            .slice()
            .sort((a, b) => a.localeCompare(b))
            .slice(0, SUGGESTION_LIMIT);
    }

    return items.value
        .filter((name) => name.toLowerCase().includes(term))
        .map((name) => ({
            name,
            score: scoreItemMatch(name, term),
        }))
        .sort((a, b) => {
            if (a.score !== b.score) {
                return a.score - b.score;
            }
            return a.name.localeCompare(b.name);
        })
        .slice(0, SUGGESTION_LIMIT)
        .map((entry) => entry.name);
});

onMounted(async () => {
    try {
        if (!$pglite) {
            throw new Error("PGlite plugin not initialized");
        }

        hydrateFeesFromStorage();
        hydrateVisibilityFromStorage();
        hydrateFiltersFromStorage();
        await Promise.all([loadTrades(), loadItems()]);
    } catch (err) {
        error.value = err instanceof Error ? err.message : String(err);
    } finally {
        loading.value = false;
    }
});

function toNumber(value: unknown) {
    const numeric = typeof value === "number" ? value : Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
}

function filterTradesByItem(list: Trade[], item: string) {
    if (!item) return list;
    const needle = item.toLowerCase();
    return list.filter((trade) => trade.item.toLowerCase() === needle);
}

function clampDuplication(value: number) {
    const numeric = Math.floor(toNumber(value));
    if (!Number.isFinite(numeric) || numeric < 1) return 1;
    return Math.min(numeric, MAX_DUPLICATIONS);
}

function percentToDecimal(value: number) {
    return toNumber(value) / 100;
}

function buildMetrics(
    input: TradeInput,
    inheritedFees: number,
    buyFeePct: number,
    sellFeePct: number,
) {
    const bid = toNumber(input.bid);
    const ask = toNumber(input.ask);
    const buyUnits = toNumber(input.buyUnits);
    const sellUnits = toNumber(input.sellUnits);
    const buyFee = percentToDecimal(buyFeePct);
    const sellFee = percentToDecimal(sellFeePct);

    const spread = ask - bid;
    const buyTradeValue = bid * buyUnits;
    const tradeValue = ask * sellUnits;
    const totalFees = buyTradeValue * buyFee + tradeValue * sellFee;
    const profit = tradeValue - buyTradeValue; // lucro bruto (sem taxas)
    const cumulativeFees = totalFees + inheritedFees;
    const realProfit = profit - cumulativeFees;

    return {
        spread,
        buyTradeValue,
        tradeValue,
        totalFees,
        profit,
        inheritedFees,
        cumulativeFees,
        realProfit,
        buyFee,
        sellFee,
    };
}

function buildSparkPath(values: number[], width = 160, height = 80) {
    if (!values.length) return "";
    const clean = values.filter((value) => Number.isFinite(value));
    if (!clean.length) return "";
    const min = Math.min(...clean);
    const max = Math.max(...clean);
    const range = max - min || 1;
    const step = values.length > 1 ? width / (values.length - 1) : width;

    return clean
        .map((value, index) => {
            const x = Math.round(index * step);
            const normalized = (value - min) / range;
            const y = Math.round(height - normalized * (height - 12) - 6);
            return `${index === 0 ? "M" : "L"} ${x} ${y}`;
        })
        .join(" ");
}

function sparkStats(values: number[]) {
    if (!values.length) return { latest: 0, delta: 0 };
    const first = values[0] ?? 0;
    const latest = values[values.length - 1] ?? first;
    const delta = latest - first;
    return { latest, delta };
}

function scoreItemMatch(name: string, term: string) {
    const lower = name.toLowerCase();
    if (lower.startsWith(term)) return 0;
    if (lower.includes(term)) return 1;
    return 2;
}

function resetSuggestionHighlight() {
    highlightedSuggestion.value = 0;
}

function cancelHideSuggestions() {
    if (hideSuggestionsTimeout === null) return;
    if (typeof window !== "undefined") {
        window.clearTimeout(hideSuggestionsTimeout);
    }
    hideSuggestionsTimeout = null;
}

function handleItemFocus() {
    cancelHideSuggestions();
    showSuggestions.value = true;
    resetSuggestionHighlight();
}

function handleItemInput() {
    cancelHideSuggestions();
    showSuggestions.value = true;
    resetSuggestionHighlight();
}

function handleItemBlur() {
    if (typeof window === "undefined") {
        showSuggestions.value = false;
        return;
    }
    hideSuggestionsTimeout = window.setTimeout(() => {
        showSuggestions.value = false;
    }, 120);
}

function selectSuggestion(name: string) {
    form.item = name;
    showSuggestions.value = false;
}

function moveSuggestion(step: number) {
    if (!filteredItems.value.length) return;
    showSuggestions.value = true;
    const total = filteredItems.value.length;
    highlightedSuggestion.value =
        (highlightedSuggestion.value + step + total) % total;
}

function handleTabComplete() {
    if (!filteredItems.value.length || !form.item.trim()) return;
    const choice =
        filteredItems.value[highlightedSuggestion.value] ||
        filteredItems.value[0];
    selectSuggestion(choice);
}

function openNewTradeModal() {
    resetForm();
    showTradeModal.value = true;
}

function downloadJson(data: unknown, filename: string) {
    if (typeof window === "undefined") return;
    const payload = JSON.stringify(data, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

async function exportBackup() {
    error.value = null;
    try {
        if (!$pglite) {
            throw new Error("PGlite plugin not initialized");
        }

        const [itemsDump, tradesDump] = await Promise.all([
            $pglite.query<ItemRow>("SELECT name, created_at FROM items;"),
            $pglite.query<TradeRow>(
                "SELECT * FROM trades ORDER BY created_at DESC, id DESC;",
            ),
        ]);

        const backup = {
            generatedAt: new Date().toISOString(),
            items: itemsDump.rows,
            trades: tradesDump.rows,
        };

        const dateSlug = new Date().toISOString().split("T")[0];
        downloadJson(backup, `tibia-trader-backup-${dateSlug}.json`);
    } catch (err) {
        error.value = err instanceof Error ? err.message : String(err);
    }
}

async function handleImportFile(event: Event) {
    error.value = null;
    const inputEl = event.target as HTMLInputElement | null;
    const file = inputEl?.files?.[0];
    if (!file) return;

    try {
        if (!$pglite) {
            throw new Error("PGlite plugin not initialized");
        }
        const text = await file.text();
        const parsed = JSON.parse(text) as {
            items?: Array<{ name: string }>;
            trades?: TradeRow[];
        };

        const itemsData = Array.isArray(parsed.items) ? parsed.items : [];
        const tradesData = Array.isArray(parsed.trades) ? parsed.trades : [];

        await $pglite.query("BEGIN;");
        try {
            await $pglite.query("DELETE FROM trades;");
            await $pglite.query("DELETE FROM items;");

            for (const item of itemsData) {
                if (!item?.name) continue;
                await $pglite.query(
                    "INSERT INTO items (name) VALUES ($1) ON CONFLICT (name) DO NOTHING;",
                    [item.name],
                );
            }

            for (const trade of tradesData) {
                await $pglite.query(
                    `
            INSERT INTO trades (
              id, item, bid, ask, spread, buy_fee, sell_fee, buy_units, sell_units,
              buy_trade_value, trade_value, total_fees, profit, inherited_fees,
              cumulative_fees, real_profit, parent_trade_id, note, created_at
            )
            OVERRIDING SYSTEM VALUE
            VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9,
              $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
            )
            ON CONFLICT (id) DO NOTHING;
          `,
                    [
                        trade.id ?? null,
                        trade.item ?? "",
                        toNumber(trade.bid),
                        toNumber(trade.ask),
                        toNumber(trade.spread),
                        toNumber(trade.buy_fee),
                        toNumber(trade.sell_fee),
                        toNumber(trade.buy_units),
                        toNumber(trade.sell_units),
                        toNumber(trade.buy_trade_value),
                        toNumber(trade.trade_value),
                        toNumber(trade.total_fees),
                        toNumber(trade.profit),
                        toNumber(trade.inherited_fees),
                        toNumber(trade.cumulative_fees),
                        toNumber(trade.real_profit),
                        trade.parent_trade_id ?? null,
                        trade.note ?? null,
                        trade.created_at ?? new Date().toISOString(),
                    ],
                );
            }

            await $pglite.query("COMMIT;");
        } catch (err) {
            await $pglite.query("ROLLBACK;");
            throw err;
        }

        await Promise.all([loadItems(), loadTrades()]);
        showBackupModal.value = false;
    } catch (err) {
        error.value = err instanceof Error ? err.message : String(err);
    } finally {
        if (importInput.value) {
            importInput.value.value = "";
        }
    }
}

async function resetDatabase() {
    error.value = null;
    if (typeof window !== "undefined") {
        const confirmed = window.confirm(
            "Tem certeza que deseja apagar todos os dados? Esta ação é irreversível.",
        );
        if (!confirmed) return;
    }

    try {
        if (!$pglite) {
            throw new Error("PGlite plugin not initialized");
        }

        await $pglite.query("BEGIN;");
        try {
            await $pglite.query("DELETE FROM trades;");
            await $pglite.query("DELETE FROM items;");
            await $pglite.query("COMMIT;");
        } catch (err) {
            await $pglite.query("ROLLBACK;");
            throw err;
        }

        trades.value = [];
        items.value = [];
        selectedChartItem.value = "";
        selectedListItem.value = "";
    } catch (err) {
        error.value = err instanceof Error ? err.message : String(err);
    }
}

function closeTradeModal() {
    showTradeModal.value = false;
    showSuggestions.value = false;
    resetForm();
}

async function deleteItemFromDb(name: string) {
    if (!name.trim()) return;
    if (!$pglite) {
        throw new Error("PGlite plugin not initialized");
    }
    await $pglite!.query("DELETE FROM items WHERE name = $1;", [name]);
    const lower = name.toLowerCase();
    items.value = items.value.filter(
        (candidate) => candidate.toLowerCase() !== lower,
    );
    if (form.item.trim().toLowerCase() === lower) {
        form.item = "";
    }
    resetSuggestionHighlight();
}

async function handleDeleteSuggestion(event: KeyboardEvent) {
    if (!showSuggestions.value || !filteredItems.value.length) return;
    event.preventDefault();
    const target =
        filteredItems.value[highlightedSuggestion.value] ||
        filteredItems.value[0];
    try {
        await deleteItemFromDb(target);
    } catch (err) {
        error.value = err instanceof Error ? err.message : String(err);
    }
}

function mapTradeRow(row: TradeRow): Trade {
    return {
        id: row.id,
        item: row.item,
        bid: toNumber(row.bid),
        ask: toNumber(row.ask),
        spread: toNumber(row.spread),
        buyFee: toNumber(row.buy_fee),
        sellFee: toNumber(row.sell_fee),
        buyUnits: toNumber(row.buy_units),
        sellUnits: toNumber(row.sell_units),
        buyTradeValue: toNumber(row.buy_trade_value),
        tradeValue: toNumber(row.trade_value),
        totalFees: toNumber(row.total_fees),
        profit: toNumber(row.profit),
        inheritedFees: toNumber(row.inherited_fees),
        cumulativeFees: toNumber(row.cumulative_fees),
        realProfit: toNumber(row.real_profit),
        parentTradeId: row.parent_trade_id,
        note: row.note,
        createdAt: row.created_at,
    };
}

async function loadTrades() {
    const result = await $pglite!.query<TradeRow>(`
    SELECT
      id, item, bid, ask, spread, buy_fee, sell_fee, buy_units, sell_units,
      buy_trade_value, trade_value, total_fees, profit,
      inherited_fees, cumulative_fees, real_profit, parent_trade_id, note,
      created_at
    FROM trades
    ORDER BY created_at DESC, id DESC;
  `);

    trades.value = result.rows.map(mapTradeRow);
}

async function loadItems() {
    const result = await $pglite!.query<ItemRow>(`
    SELECT name FROM items ORDER BY name;
  `);
    items.value = result.rows.map((row) => row.name);
}

function hydrateFeesFromStorage() {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("tibia-trader-fees");
    if (!raw) return;
    try {
        const parsed = JSON.parse(raw) as {
            buyFeePct?: number;
            sellFeePct?: number;
        };
        if (typeof parsed.buyFeePct === "number") {
            globalBuyFeePct.value = parsed.buyFeePct;
        }
        if (typeof parsed.sellFeePct === "number") {
            globalSellFeePct.value = parsed.sellFeePct;
        }
    } catch {
        // ignore parse errors
    }
}

function hydrateVisibilityFromStorage() {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(VISIBILITY_STORAGE_KEY);
    if (!raw) return;

    try {
        const parsed = JSON.parse(raw) as {
            showCharts?: boolean;
            showTrades?: boolean;
            showTotals?: boolean;
        };

        if (typeof parsed.showCharts === "boolean") {
            showCharts.value = parsed.showCharts;
        }

        if (typeof parsed.showTrades === "boolean") {
            showTrades.value = parsed.showTrades;
        }

        if (typeof parsed.showTotals === "boolean") {
            showTotals.value = parsed.showTotals;
        }
    } catch {
        // ignore parse errors
    }
}

function hydrateFiltersFromStorage() {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(FILTER_STORAGE_KEY);
    if (!raw) return;

    try {
        const parsed = JSON.parse(raw) as {
            chart?: string;
            totals?: string;
            list?: string;
            global?: string;
        };

        if (typeof parsed.chart === "string") {
            selectedChartItem.value = parsed.chart;
        }
        if (typeof parsed.totals === "string") {
            selectedTotalsItem.value = parsed.totals;
        }
        if (typeof parsed.list === "string") {
            selectedListItem.value = parsed.list;
        }
        if (typeof parsed.global === "string") {
            globalItemFilter.value = parsed.global;
            selectedChartItem.value = parsed.global;
            selectedTotalsItem.value = parsed.global;
            selectedListItem.value = parsed.global;
        }
    } catch {
        // ignore parse errors
    }
}

watch([globalBuyFeePct, globalSellFeePct], ([buy, sell]) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
        "tibia-trader-fees",
        JSON.stringify({ buyFeePct: buy, sellFeePct: sell }),
    );
});

watch([showCharts, showTrades, showTotals], ([charts, trades, totals]) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
        VISIBILITY_STORAGE_KEY,
        JSON.stringify({
            showCharts: charts,
            showTrades: trades,
            showTotals: totals,
        }),
    );
});

watch(
    [
        selectedChartItem,
        selectedTotalsItem,
        selectedListItem,
        globalItemFilter,
    ],
    ([chart, totals, list, global]) => {
        if (typeof window === "undefined") return;
        window.localStorage.setItem(
            FILTER_STORAGE_KEY,
            JSON.stringify({
                chart,
                totals,
                list,
                global,
            }),
        );
    },
);

watch(globalItemFilter, (value) => {
    selectedChartItem.value = value;
    selectedTotalsItem.value = value;
    selectedListItem.value = value;
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
        FILTER_STORAGE_KEY,
        JSON.stringify({
            chart: selectedChartItem.value,
            totals: selectedTotalsItem.value,
            list: selectedListItem.value,
            global: value,
        }),
    );
});

function ensureSelectionExists(selection: { value: string }) {
    if (!selection.value) return;
    const exists = items.value.some(
        (name) => name.toLowerCase() === selection.value.toLowerCase(),
    );
    if (!exists) {
        selection.value = "";
    }
}

watch(items, () => {
    ensureSelectionExists(selectedChartItem);
    ensureSelectionExists(selectedTotalsItem);
    ensureSelectionExists(selectedListItem);
    ensureSelectionExists(globalItemFilter);
});

async function ensureItemExists(name: string) {
    if (!name.trim()) return;
    if (
        items.value.some(
            (stored) => stored.toLowerCase() === name.toLowerCase(),
        )
    ) {
        return;
    }

    await $pglite!.query(
        `
      INSERT INTO items (name)
      VALUES ($1)
      ON CONFLICT (name) DO NOTHING;
    `,
        [name],
    );
    await loadItems();
}

async function registerItem() {
    error.value = null;
    try {
        if (!$pglite) {
            throw new Error("PGlite plugin not initialized");
        }
        const name = form.item.trim();
        if (name.length < 2) {
            throw new Error(
                "Informe pelo menos 2 caracteres para cadastrar o item.",
            );
        }
        await ensureItemExists(name);
    } catch (err) {
        error.value = err instanceof Error ? err.message : String(err);
    }
}

async function submitTrade() {
    error.value = null;
    saving.value = true;

    try {
        if (!$pglite) {
            throw new Error("PGlite plugin not initialized");
        }

        const itemName = form.item.trim();
        if (!itemName) {
            throw new Error("Informe o item negociado antes de salvar.");
        }

        await ensureItemExists(itemName);

        const duplication = editingTradeId.value
            ? 1
            : clampDuplication(form.duplicationCount);

        const metrics = buildMetrics(
            form,
            parentFee.value,
            globalBuyFeePct.value,
            globalSellFeePct.value,
        );
        const values = [
            itemName,
            Number(form.bid),
            Number(form.ask),
            metrics.spread,
            metrics.buyFee,
            metrics.sellFee,
            Number(form.buyUnits),
            Number(form.sellUnits),
            metrics.buyTradeValue,
            metrics.tradeValue,
            metrics.totalFees,
            metrics.profit,
            metrics.inheritedFees,
            metrics.cumulativeFees,
            metrics.realProfit,
            selectedParentId.value,
            form.note?.trim() || null,
        ];

        const isEditing = editingTradeId.value !== null;
        const updateQuery = `
        UPDATE trades
        SET
          item = $1,
          bid = $2,
          ask = $3,
          spread = $4,
          buy_fee = $5,
          sell_fee = $6,
          buy_units = $7,
          sell_units = $8,
          buy_trade_value = $9,
          trade_value = $10,
          total_fees = $11,
          profit = $12,
          inherited_fees = $13,
          cumulative_fees = $14,
          real_profit = $15,
          parent_trade_id = $16,
          note = $17
        WHERE id = $18
        RETURNING
          id, item, bid, ask, spread, buy_fee, sell_fee, buy_units, sell_units,
          buy_trade_value, trade_value, total_fees, profit,
          inherited_fees, cumulative_fees, real_profit, parent_trade_id, note,
          created_at;
      `;
        const insertQuery = `
        INSERT INTO trades (
          item, bid, ask, spread, buy_fee, sell_fee, buy_units, sell_units,
          buy_trade_value, trade_value, total_fees, profit,
          inherited_fees, cumulative_fees, real_profit, parent_trade_id, note
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14, $15, $16, $17
        )
        RETURNING
          id, item, bid, ask, spread, buy_fee, sell_fee, buy_units, sell_units,
          buy_trade_value, trade_value, total_fees, profit,
          inherited_fees, cumulative_fees, real_profit, parent_trade_id, note,
          created_at;
      `;

        if (isEditing) {
            const result = await $pglite.query<TradeRow>(
                updateQuery,
                [...values, editingTradeId.value],
            );
            const saved = mapTradeRow(result.rows[0]);
            trades.value = trades.value.map((trade) =>
                trade.id === saved.id ? saved : trade,
            );
            editingTradeId.value = null;
            resetForm(saved.item);
        } else {
            const inserted: Trade[] = [];
            for (let i = 0; i < duplication; i += 1) {
                const result = await $pglite.query<TradeRow>(
                    insertQuery,
                    values,
                );
                inserted.push(mapTradeRow(result.rows[0]));
            }
            trades.value.unshift(...inserted);
            resetForm(itemName);
        }

        showSuggestions.value = false;
        showTradeModal.value = false;
    } catch (err) {
        error.value = err instanceof Error ? err.message : String(err);
    } finally {
        saving.value = false;
    }
}

function resetForm(nextItem = "") {
    editingTradeId.value = null;
    form.item = nextItem;
    form.bid = 0;
    form.ask = 0;
    form.buyUnits = 1;
    form.sellUnits = 1;
    form.parentTradeId = null;
    form.note = "";
    form.duplicationCount = 1;
}

function prefillUndercut(base: Trade) {
    editingTradeId.value = null;
    form.item = base.item;
    form.bid = base.bid;
    form.ask = Math.max(base.ask - 100, 0);
    form.buyUnits = base.buyUnits;
    form.sellUnits = base.sellUnits;
    form.parentTradeId = base.id;
    form.note = `Undercut de #${base.id}`;
    form.duplicationCount = 1;
    showTradeModal.value = true;
}

function startEdit(trade: Trade) {
    editingTradeId.value = trade.id;
    form.item = trade.item;
    form.bid = trade.bid;
    form.ask = trade.ask;
    form.buyUnits = trade.buyUnits;
    form.sellUnits = trade.sellUnits;
    form.parentTradeId = trade.parentTradeId;
    form.note = trade.note ?? "";
    form.duplicationCount = 1;
    showTradeModal.value = true;
}

async function deleteTrade(tradeId: number) {
    error.value = null;
    const confirmed =
        typeof window === "undefined" ||
        window.confirm(
            `Remover ordem #${tradeId}? Filhos vao perder o link de undercut.`,
        );

    if (!confirmed) return;

    try {
        if (!$pglite) {
            throw new Error("PGlite plugin not initialized");
        }

        if (editingTradeId.value === tradeId) {
            resetForm();
        }

        await $pglite.query(
            "UPDATE trades SET parent_trade_id = NULL WHERE parent_trade_id = $1;",
            [tradeId],
        );
        await $pglite.query("DELETE FROM trades WHERE id = $1;", [tradeId]);

        trades.value = trades.value
            .map((trade) => trade.parentTradeId === tradeId  ? { ...trade, parentTradeId: null }  : trade)
            .filter((trade) => trade.id !== tradeId);

        await loadTrades();
    } catch (err) {
        error.value = err instanceof Error ? err.message : String(err);
    }
}

function describeParent(trade: Trade) {
    if (!trade.parentTradeId) {
        return "Primaria";
    }

    const parent = trades.value.find(
        (candidate) => candidate.id === trade.parentTradeId,
    );

    return parent
        ? `Undercut de #${parent.id} (${parent.item})`
        : "Undercut (referencia nao encontrada)";
}

function formatGold(value: number) {
    const rounded = Math.round(value);

    const formatted = rounded.toLocaleString("pt-BR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });

    return `🪙 ${formatted}`;
}

function formatPercent(value: number) {
    return `${(value * 100).toFixed(2)}%`;
}

function formatUnits(value: number) {
    return value.toLocaleString("pt-BR");
}
</script>

<template>
    <div class="layout">
        <Analytics />
        <AppHero
            :items="items"
            :global-item-filter="globalItemFilter"
            @update:global-item-filter="(value) => (globalItemFilter = value)"
            @new-trade="openNewTradeModal"
            @open-fee="showFeeModal = true"
            @open-backup="showBackupModal = true"
        />

        <FeeModal
            :open="showFeeModal"
            :global-buy-fee-pct="globalBuyFeePct"
            :global-sell-fee-pct="globalSellFeePct"
            @update:global-buy-fee-pct="(value) => (globalBuyFeePct = value)"
            @update:global-sell-fee-pct="(value) => (globalSellFeePct = value)"
            @close="showFeeModal = false"
        />

        <BackupModal
            :open="showBackupModal"
            :import-input="importInput"
            :error-message="error"
            @close="showBackupModal = false"
            @export="exportBackup"
            @import="handleImportFile"
            @reset="resetDatabase"
        />

        <TradeModal
            v-model:show="showTradeModal"
            v-model:form="form"
            :items="items"
            :trades="trades"
            :editing-trade-id="editingTradeId"
            :saving="saving"
            :filtered-items="filteredItems"
            :show-suggestions="showSuggestions"
            :highlighted-suggestion="highlightedSuggestion"
            :max-duplications="MAX_DUPLICATIONS"
            :derived="derived"
            :selected-parent-id="selectedParentId"
            :can-register-item="canRegisterItem"
            :format-gold="formatGold"
            :format-units="formatUnits"
            :on-submit="submitTrade"
            :on-register-item="registerItem"
            :on-select-suggestion="selectSuggestion"
            :on-move-suggestion="moveSuggestion"
            :on-tab-complete="handleTabComplete"
            :on-delete-suggestion="handleDeleteSuggestion"
            :on-handle-item-input="handleItemInput"
            :on-handle-item-focus="handleItemFocus"
            :on-handle-item-blur="handleItemBlur"
            @close="closeTradeModal"
        />

        <AboutPanel
            :show-about="showAbout"
            @update:show-about="(value) => (showAbout = value)"
        />

        <TotalsPanel
            :show-totals="showTotals"
            :items="items"
            :selected-totals-item="selectedTotalsItem"
            :totals-snapshot="totalsSnapshot"
            :has-trades="trades.length > 0"
            :has-filtered-trades="filteredTotalsTrades.length > 0"
            :format-gold="formatGold"
            :format-units="formatUnits"
            @update:show-totals="(value) => (showTotals = value)"
            @update:selected-totals-item="(value) => (selectedTotalsItem = value)"
        />

        <ChartsPanel
            :show-charts="showCharts"
            :items="items"
            :selected-chart-item="selectedChartItem"
            :trades-length="trades.length"
            :chart-series="chartSeries"
            :chart-stats="chartStats"
            :build-spark-path="buildSparkPath"
            :format-gold="formatGold"
            :format-units="formatUnits"
            @update:show-charts="(value) => (showCharts = value)"
            @update:selected-chart-item="(value) => (selectedChartItem = value)"
        />

        <TradesPanel
            :show-trades="showTrades"
            :items="items"
            :selected-list-item="selectedListItem"
            :filtered-list-trades="filteredListTrades"
            :has-trades="trades.length > 0"
            :loading="loading"
            :format-gold="formatGold"
            :format-units="formatUnits"
            :format-percent="formatPercent"
            :describe-parent="describeParent"
            @update:show-trades="(value) => (showTrades = value)"
            @update:selected-list-item="(value) => (selectedListItem = value)"
            @prefill-undercut="prefillUndercut"
            @edit="startEdit"
            @delete="deleteTrade"
        />
    </div>
</template>
<style src="./assets/main.css"></style>
