<script setup lang="ts">
import { Analytics } from "@vercel/analytics/nuxt";

type TradeRow = {
    id: number;
    item: string;
    bid: number;
    ask: number;
    spread: number;
    buy_fee: number;
    sell_fee: number;
    buy_units: number;
    sell_units: number;
    buy_trade_value: number;
    trade_value: number;
    total_fees: number;
    profit: number;
    inherited_fees: number;
    cumulative_fees: number;
    real_profit: number;
    parent_trade_id: number | null;
    note: string | null;
    created_at: string;
};

type ItemRow = {
    name: string;
};

type TradeInput = {
    item: string;
    bid: number;
    ask: number;
    buyUnits: number;
    sellUnits: number;
    parentTradeId: number | null;
    note: string;
    duplicationCount: number;
};

type Trade = {
    id: number;
    item: string;
    bid: number;
    ask: number;
    spread: number;
    buyFee: number;
    sellFee: number;
    buyUnits: number;
    sellUnits: number;
    buyTradeValue: number;
    tradeValue: number;
    totalFees: number;
    profit: number;
    inheritedFees: number;
    cumulativeFees: number;
    realProfit: number;
    parentTradeId: number | null;
    note: string | null;
    createdAt: string;
};

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
            acc.totalFees += toNumber(trade.totalFees);
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

function triggerImport() {
    if (typeof window === "undefined") return;
    importInput.value?.click();
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
        <header class="hero">
            <div class="hero__left">
                <p class="eyebrow">
                    <img class="logo-mark" src="/logo.png" alt="TMD" />
                    Tibia Market Desk
                </p>
                <!-- <h1>Ordens de compra, venda e undercut</h1>
                <p class="subtitle">
                    Lance compras e vendas com bid/ask, taxas, spread e undercut
                    encadeado. Os calculos aparecem antes de salvar no banco.
                </p> -->
            </div>
            <div class="hero__actions">
                <div class="hero__filter">
                    <select id="globalFilter" v-model="globalItemFilter">
                        <option value="">Todos os itens</option>
                        <option v-for="item in items" :key="item" :value="item">
                            {{ item }}
                        </option>
                    </select>
                </div>
                <button
                    class="primary"
                    type="button"
                    @click="openNewTradeModal"
                >
                    Nova ordem
                </button>
                <button
                    class="ghost"
                    type="button"
                    @click="showFeeModal = true"
                >
                    Taxas
                </button>
                <button
                    class="ghost"
                    type="button"
                    @click="showBackupModal = true"
                >
                    Backup
                </button>

              <a
                  class="hero__github"
                  href="https://github.com/vinicius-rech/tibia-market"
                  target="_blank"
                  rel="noopener noreferrer"
              >
                <UIcon name="i-simple-icons-github" class="hero__github-icon" />
                Github
              </a>
            </div>
        </header>

        <div
            v-if="showFeeModal"
            class="modal-backdrop"
            @click.self="showFeeModal = false"
        >
            <div class="modal">
                <div class="modal__header">
                    <div>
                        <p class="eyebrow">Taxas globais</p>
                        <h3>Buy fee e Sell fee padroes</h3>
                    </div>
                    <button
                        class="ghost"
                        type="button"
                        @click="showFeeModal = false"
                    >
                        ✕
                    </button>
                </div>
                <div class="modal__body">
                    <p class="helper">
                        Estas taxas serao usadas em todas as ordens (novas ou
                        editadas).
                    </p>
                    <div class="field two-col">
                        <div>
                            <label>Buy fee (%)</label>
                            <input
                                v-model.number="globalBuyFeePct"
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                            />
                        </div>
                        <div>
                            <label>Sell fee (%)</label>
                            <input
                                v-model.number="globalSellFeePct"
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                            />
                        </div>
                    </div>
                    <p class="helper">
                        Recalculo dos campos considera taxas herdadas de
                        undercut + estas taxas globais.
                    </p>
                </div>
                <div class="modal__footer">
                    <button
                        class="ghost"
                        type="button"
                        @click="showFeeModal = false"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>

        <div
            v-if="showBackupModal"
            class="modal-backdrop"
            @click.self="showBackupModal = false"
        >
            <div class="modal">
                <div class="modal__header">
                    <div>
                        <p class="eyebrow">Backup</p>
                        <h3>Exportar ou importar dados</h3>
                    </div>
                    <button
                        class="ghost"
                        type="button"
                        @click="showBackupModal = false"
                    >
                        Fechar
                    </button>
                </div>
                <div class="modal__body">
                    <p class="helper">
                        Exporta itens e ordens para um JSON e permite restaurar
                        o mesmo arquivo depois.
                    </p>
                    <div class="panel__actions">
                        <button
                            class="primary"
                            type="button"
                            @click="exportBackup"
                        >
                            Exportar dados
                        </button>
                        <button
                            class="ghost"
                            type="button"
                            @click="triggerImport"
                        >
                            Importar dados
                        </button>
                        <button
                            class="danger"
                            type="button"
                            @click="resetDatabase"
                        >
                            Resetar dados
                        </button>
                        <input
                            ref="importInput"
                            type="file"
                            accept="application/json"
                            class="hidden-file-input"
                            @change="handleImportFile"
                        />
                    </div>
                    <p class="helper">
                        A importacao substitui itens e ordens existentes pelo
                        conteudo do arquivo selecionado.
                    </p>
                </div>
            </div>
        </div>

        <div
            v-if="showTradeModal"
            class="modal-backdrop"
            @keydown.esc="closeTradeModal"
        >
            <div class="modal modal--wide">
                <section class="panel">
                    <div class="panel__header">
                        <div>
                            <p class="eyebrow">Lançamento</p>
                            <h2>
                                {{
                                    editingTradeId
                                        ? `Editando #${editingTradeId}`
                                        : "Nova ordem"
                                }}
                            </h2>
                        </div>
                        <div class="panel__actions">
                            <button
                                class="ghost"
                                type="button"
                                :disabled="saving"
                                @click="resetForm()"
                            >
                                Limpar
                            </button>
                            <button
                                v-if="editingTradeId"
                                class="ghost"
                                type="button"
                                :disabled="saving"
                                @click="resetForm()"
                            >
                                Cancelar edicao
                            </button>
                            <button
                                class="ghost"
                                type="button"
                                @click="closeTradeModal"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                    <div class="panel__body">
                        <form class="form" @submit.prevent="submitTrade">
                            <div class="field">
                                <label>Item</label>
                                <div class="autocomplete">
                                    <input
                                        v-model="form.item"
                                        type="text"
                                        autocomplete="off"
                                        spellcheck="false"
                                        placeholder="Nome do item"
                                        required
                                        @focus="handleItemFocus"
                                        @input="handleItemInput"
                                        @blur="handleItemBlur"
                                        @keydown.down.prevent="
                                            moveSuggestion(1)
                                        "
                                        @keydown.up.prevent="moveSuggestion(-1)"
                                        @keydown.delete="handleDeleteSuggestion"
                                        @keydown.tab="handleTabComplete"
                                    />
                                    <ul
                                        v-if="
                                            showSuggestions &&
                                            filteredItems.length
                                        "
                                        class="suggestions"
                                        @mousedown.prevent
                                    >
                                        <li
                                            v-for="(
                                                itemName, index
                                            ) in filteredItems"
                                            :key="itemName"
                                            :class="{
                                                active:
                                                    highlightedSuggestion ===
                                                    index,
                                            }"
                                            @mousedown.prevent="
                                                selectSuggestion(itemName)
                                            "
                                            @mouseenter="
                                                highlightedSuggestion = index
                                            "
                                        >
                                            <span>{{ itemName }}</span>
                                            <span
                                                v-if="
                                                    highlightedSuggestion ===
                                                    index
                                                "
                                                class="suggestions__hint"
                                            >
                                                Tab para completar
                                            </span>
                                        </li>
                                    </ul>
                                </div>
                                <p class="helper">
                                    Busca itens ja cadastrados, prioriza
                                    prefixos e permite completar com Tab.
                                </p>
                                <button
                                    v-if="canRegisterItem"
                                    class="ghost inline"
                                    type="button"
                                    :disabled="saving"
                                    @click="registerItem"
                                >
                                    Cadastrar "{{ form.item.trim() }}"
                                </button>
                            </div>
                            <div class="field two-col">
                                <div>
                                    <label>Bid (compra)</label>
                                    <input
                                        v-model.number="form.bid"
                                        type="number"
                                        min="0"
                                        step="1"
                                        required
                                    />
                                </div>
                                <div>
                                    <label>Ask (venda)</label>
                                    <input
                                        v-model.number="form.ask"
                                        type="number"
                                        min="0"
                                        step="1"
                                        required
                                    />
                                </div>
                            </div>
                            <div class="field two-col">
                                <div>
                                    <label>Buy units</label>
                                    <input
                                        v-model.number="form.buyUnits"
                                        type="number"
                                        min="0"
                                        step="1"
                                        required
                                    />
                                </div>
                                <div>
                                    <label>Sell units</label>
                                    <input
                                        v-model.number="form.sellUnits"
                                        type="number"
                                        min="0"
                                        step="1"
                                        required
                                    />
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
                                        #{{ trade.id }} · {{ trade.item }} ·
                                        taxas herdadas:
                                        {{ formatGold(trade.cumulativeFees) }}
                                    </option>
                                </select>
                                <p class="helper">
                                    Selecione uma ordem para encadear um
                                    undercut e trazer as taxas acumuladas para o
                                    lucro real.
                                </p>
                            </div>
                            <div class="field">
                                <label>Duplicar ordens (quantidade)</label>
                                <input
                                    v-model.number="form.duplicationCount"
                                    type="number"
                                    min="1"
                                    :max="MAX_DUPLICATIONS"
                                    step="1"
                                    :disabled="!!editingTradeId"
                                />
                                <p class="helper">
                                    Cria copias independentes ao salvar a ordem.
                                    Ignorado ao editar. Limite de
                                    {{ MAX_DUPLICATIONS }} copias.
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
                                        <strong>{{
                                            formatGold(derived.spread)
                                        }}</strong>
                                        · Profit:
                                        <strong>{{
                                            formatGold(derived.profit)
                                        }}</strong>
                                        · Real profit:
                                        <strong>{{
                                            formatGold(derived.realProfit)
                                        }}</strong>
                                    </p>
                                    <p class="helper">
                                        Real profit considera todas as taxas
                                        herdadas do encadeamento.
                                    </p>
                                </div>
                                <button
                                    class="primary"
                                    type="submit"
                                    :disabled="saving"
                                >
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
                                <span>{{ formatUnits(form.sellUnits) }} un · fee
                                    {{ derived.sellFee * 100 }}%
                                </span>
                            </div>
                            <div class="metric">
                                <p>Total fees</p>
                                <strong>{{ (derived.cumulativeFees ?? derived.totalFees) }}</strong>
                                <span>Inclui compra + venda</span>
                            </div>
                            <div class="metric">
                                <p>Profit</p>
                                <strong>{{
                                    formatGold(derived.profit)
                                }}</strong>
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
                </section>

                <!-- <section class="panel">
                <div class="panel__header">
                    <div>
                        <p class="eyebrow">Status</p>
                        <h2>Banco de ordens</h2>
                    </div>
                </div>
                <div class="panel__body status">
                    <p v-if="loading">Carregando ordens...</p>
                    <p v-else-if="error" class="error">Erro: {{ error }}</p>
                    <p v-else class="success">
                        {{ trades.length }} ordens armazenadas no PGlite.
                    </p>
                    <p class="helper">
                        Todas as colunas solicitadas (bid, ask, spread, fees,
                        trade value, profit, real profit, unidades e undercut)
                        sao persistidas.
                    </p>
                </div>
            </section> -->
            </div>
        </div>

        <section class="panel about">
            <div class="panel__header">
                <div class="panel__header__title">
                    <p class="eyebrow">Sobre</p>
                    <div class="panel__title-row">
                        <h2>Como a ferramenta funciona</h2>
                        <button
                            class="panel__toggle"
                            type="button"
                            :aria-pressed="showAbout"
                            :title="
                                showAbout
                                    ? 'Recolher sessao de sobre'
                                    : 'Expandir sessao de sobre'
                            "
                            @click="showAbout = !showAbout"
                        >
                            <svg
                                class="panel__toggle-icon"
                                viewBox="0 0 20 20"
                                aria-hidden="true"
                                :class="{ 'is-open': showAbout }"
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
                            <span>{{ showAbout ? "Esconder" : "Mostrar" }}</span>
                        </button>
                    </div>
                </div>
            </div>
            <div v-if="showAbout" class="panel__body about__content">
                <article class="about__block">
                    <p class="about__label">O que e</p>
                    <h3>Tibia Market Desk</h3>
                    <p>
                        Dashboard local para simular, salvar e acompanhar trades
                        do mercado do Tibia com calculo de fees, spread e
                        encadeamento de undercuts.
                    </p>
                </article>
                <article class="about__block">
                    <p class="about__label">Como usar</p>
                    <h3>Passo a passo rapido</h3>
                    <ul class="about__list">
                        <li>
                            Escolha um item (ou cadastre um nome novo) e
                            preencha bid/ask e unidades.
                        </li>
                        <li>
                            Ajuste as taxas globais ou por ordem; o resumo de
                            metricas calcula spread, fees e real profit antes
                            de salvar.
                        </li>
                        <li>
                            Grave a ordem. Use "Criar undercut" em qualquer
                            trade para herdar fees e manter o historico ligado.
                        </li>
                        <li>
                            Filtre por item nos paineis de totais, graficos e
                            historico para comparar desempenhos.
                        </li>
                        <li>
                            Use o backup para exportar/importar os dados locais
                            ou limpar tudo quando quiser recomeçar.
                        </li>
                    </ul>
                </article>
            </div>
        </section>

        <section class="panel totals">
            <div class="panel__header">
                <div class="panel__header__title">
                    <p class="eyebrow">Resumo</p>
                    <div class="panel__title-row">
                        <h2>Totais consolidados</h2>
                        <button
                            class="panel__toggle"
                            type="button"
                            :aria-pressed="showTotals"
                            :title="
                                showTotals
                                    ? 'Recolher painel de totais'
                                    : 'Expandir painel de totais'
                            "
                            @click="showTotals = !showTotals"
                        >
                            <svg
                                class="panel__toggle-icon"
                                viewBox="0 0 20 20"
                                aria-hidden="true"
                                :class="{ 'is-open': showTotals }"
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
                            <span>{{
                                showTotals ? "Esconder" : "Mostrar"
                            }}</span>
                        </button>
                    </div>
                </div>
                <div class="panel__actions">
                    <select v-model="selectedTotalsItem">
                        <option value="">Todos os itens</option>
                        <option v-for="item in items" :key="item" :value="item">
                            {{ item }}
                        </option>
                    </select>
                </div>
            </div>
            <div v-if="showTotals" class="panel__body">
                <p v-if="trades.length === 0" class="helper">
                    Cadastre ordens para ver os totais consolidados.
                </p>
                <p
                    v-else-if="filteredTotalsTrades.length === 0"
                    class="helper"
                >
                    Nenhuma ordem encontrada para este filtro.
                </p>
                <div v-else class="totals-grid">
                    <article class="total-card">
                        <p class="total-card__label">Valor vendido</p>
                        <p class="total-card__value">
                            {{ formatGold(totalsSnapshot.totalValue) }}
                        </p>
                        <p class="total-card__meta">
                            Soma de trade value das ordens filtradas.
                        </p>
                    </article>
                    <article class="total-card">
                        <p class="total-card__label">Taxas pagas</p>
                        <p class="total-card__value">
                            {{ formatGold(totalsSnapshot.totalFees) }}
                        </p>
                        <p class="total-card__meta">
                            All time (taxas diretas e herdadas).
                        </p>
                    </article>
                    <article
                        class="total-card"
                        :class="
                            totalsSnapshot.totalRealProfit >= 0
                                ? 'total-card--positive'
                                : 'total-card--negative'
                        "
                    >
                        <p class="total-card__label">Real profit</p>
                        <p class="total-card__value">
                            {{ formatGold(totalsSnapshot.totalRealProfit) }}
                        </p>
                        <p class="total-card__meta">Lucro liquido acumulado.</p>
                    </article>
                    <article class="total-card total-card--neutral">
                        <p class="total-card__label">Undercuts</p>
                        <p class="total-card__value">
                            {{ formatUnits(totalsSnapshot.undercuts) }}
                        </p>
                        <p class="total-card__meta">
                            Ordens com referencia de undercut.
                        </p>
                    </article>
                    <article class="total-card total-card--neutral">
                        <p class="total-card__label">Trades</p>
                        <p class="total-card__value">
                            {{ formatUnits(totalsSnapshot.count) }}
                        </p>
                        <p class="total-card__meta">
                            Quantidade total do filtro.
                        </p>
                    </article>
                </div>
            </div>
        </section>

        <section class="panel charts">
            <div class="panel__header">
                <div class="panel__header__title">
                    <p class="eyebrow">Insights</p>
                    <div class="panel__title-row">
                        <h2>Graficos rápidos</h2>
                        <button
                            class="panel__toggle"
                            type="button"
                            :aria-pressed="showCharts"
                            :title="
                                showCharts
                                    ? 'Recolher graficos'
                                    : 'Expandir graficos'
                            "
                            @click="showCharts = !showCharts"
                        >
                            <svg
                                class="panel__toggle-icon"
                                viewBox="0 0 20 20"
                                aria-hidden="true"
                                :class="{ 'is-open': showCharts }"
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
                            <span>{{ showCharts ? "Esconder" : "Mostrar" }}</span>
                        </button>
                    </div>
                </div>
                <div class="panel__actions">
                    <select v-model="selectedChartItem">
                        <option value="">Todos os itens</option>
                        <option v-for="item in items" :key="item" :value="item">
                            {{ item }}
                        </option>
                    </select>
                </div>
            </div>
            <div v-if="showCharts" class="panel__body">
                <p v-if="trades.length === 0" class="helper">
                    Cadastre ordens para visualizar historico e tendencias.
                </p>
                <div v-else class="charts-grid">
                    <article class="chart-card">
                        <div class="chart-card__header">
                            <p>Real profit</p>
                            <strong>{{
                                formatGold(chartStats.profit.latest)
                            }}</strong>
                            <span
                                :class="{
                                    positive: chartStats.profit.delta >= 0,
                                    negative: chartStats.profit.delta < 0,
                                }"
                            >
                                {{ formatGold(chartStats.profit.delta) }}
                            </span>
                        </div>
                        <svg
                            class="sparkline"
                            viewBox="0 0 160 80"
                            preserveAspectRatio="none"
                        >
                            <path
                                class="sparkline__stroke"
                                :d="buildSparkPath(chartSeries.profit)"
                            />
                        </svg>
                    </article>
                    <article class="chart-card">
                        <div class="chart-card__header">
                            <p>Spread</p>
                            <strong>{{
                                formatGold(chartStats.spread.latest)
                            }}</strong>
                            <span
                                :class="{
                                    positive: chartStats.spread.delta >= 0,
                                    negative: chartStats.spread.delta < 0,
                                }"
                            >
                                {{ formatGold(chartStats.spread.delta) }}
                            </span>
                        </div>
                        <svg
                            class="sparkline"
                            viewBox="0 0 160 80"
                            preserveAspectRatio="none"
                        >
                            <path
                                class="sparkline__stroke"
                                :d="buildSparkPath(chartSeries.spread)"
                            />
                        </svg>
                    </article>
                    <article class="chart-card">
                        <div class="chart-card__header">
                            <p>Valor de compra</p>
                            <strong>{{
                                formatGold(chartStats.buyValue.latest)
                            }}</strong>
                            <span
                                :class="{
                                    positive: chartStats.buyValue.delta >= 0,
                                    negative: chartStats.buyValue.delta < 0,
                                }"
                            >
                                {{ formatGold(chartStats.buyValue.delta) }}
                            </span>
                        </div>
                        <svg
                            class="sparkline"
                            viewBox="0 0 160 80"
                            preserveAspectRatio="none"
                        >
                            <path
                                class="sparkline__stroke"
                                :d="buildSparkPath(chartSeries.buyValue)"
                            />
                        </svg>
                    </article>
                    <article class="chart-card">
                        <div class="chart-card__header">
                            <p>Valor de venda</p>
                            <strong>{{
                                formatGold(chartStats.sellValue.latest)
                            }}</strong>
                            <span
                                :class="{
                                    positive: chartStats.sellValue.delta >= 0,
                                    negative: chartStats.sellValue.delta < 0,
                                }"
                            >
                                {{ formatGold(chartStats.sellValue.delta) }}
                            </span>
                        </div>
                        <svg
                            class="sparkline"
                            viewBox="0 0 160 80"
                            preserveAspectRatio="none"
                        >
                            <path
                                class="sparkline__stroke"
                                :d="buildSparkPath(chartSeries.sellValue)"
                            />
                        </svg>
                    </article>
                    <article class="chart-card">
                        <div class="chart-card__header">
                            <p>Taxas</p>
                            <strong>{{
                                formatGold(chartStats.fees.latest)
                            }}</strong>
                            <span
                                :class="{
                                    positive: chartStats.fees.delta >= 0,
                                    negative: chartStats.fees.delta < 0,
                                }"
                            >
                                {{ formatGold(chartStats.fees.delta) }}
                            </span>
                        </div>
                        <svg
                            class="sparkline"
                            viewBox="0 0 160 80"
                            preserveAspectRatio="none"
                        >
                            <path
                                class="sparkline__stroke"
                                :d="buildSparkPath(chartSeries.fees)"
                            />
                        </svg>
                    </article>
                    <article class="chart-card">
                        <div class="chart-card__header">
                            <p>Unidades totais</p>
                            <strong>{{
                                formatUnits(chartStats.units.latest)
                            }}</strong>
                            <span
                                :class="{
                                    positive: chartStats.units.delta >= 0,
                                    negative: chartStats.units.delta < 0,
                                }"
                            >
                                {{
                                    formatUnits(
                                        Math.round(chartStats.units.delta),
                                    )
                                }}
                            </span>
                        </div>
                        <svg
                            class="sparkline"
                            viewBox="0 0 160 80"
                            preserveAspectRatio="none"
                        >
                            <path
                                class="sparkline__stroke"
                                :d="buildSparkPath(chartSeries.units)"
                            />
                        </svg>
                    </article>
                </div>
            </div>
        </section>

        <section class="panel trades">
            <div class="panel__header">
                <div class="panel__header__title">
                    <p class="eyebrow">Ordens</p>
                    <div class="panel__title-row">
                        <h2>Historico</h2>
                        <button
                            class="panel__toggle"
                            type="button"
                            :aria-pressed="showTrades"
                            :title="
                                showTrades
                                    ? 'Recolher historico'
                                    : 'Expandir historico'
                            "
                            @click="showTrades = !showTrades"
                        >
                            <svg
                                class="panel__toggle-icon"
                                viewBox="0 0 20 20"
                                aria-hidden="true"
                                :class="{ 'is-open': showTrades }"
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
                            <span>{{ showTrades ? "Esconder" : "Mostrar" }}</span>
                        </button>
                    </div>
                </div>
                <div class="panel__actions">
                    <select v-model="selectedListItem">
                        <option value="">Todos os itens</option>
                        <option v-for="item in items" :key="item" :value="item">
                            {{ item }}
                        </option>
                    </select>
                </div>
            </div>
            <div v-if="showTrades" class="panel__body">
                <p v-if="loading">Carregando...</p>
                <p v-else-if="trades.length === 0">Nenhuma ordem cadastrada.</p>
                <div v-else-if="filteredListTrades.length === 0" class="helper">
                    Nenhuma ordem para o filtro selecionado.
                </div>
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
                                <button
                                    class="ghost"
                                    type="button"
                                    @click="prefillUndercut(trade)"
                                >
                                    Criar undercut
                                </button>
                                <button
                                    class="ghost"
                                    type="button"
                                    @click="startEdit(trade)"
                                >
                                    Editar
                                </button>
                                <button
                                    class="danger"
                                    type="button"
                                    @click="deleteTrade(trade.id)"
                                >
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
                                <span
                                    >Spread:
                                    {{ formatGold(trade.spread) }}</span
                                >
                            </div>
                            <div class="cell">
                                <p>Buy order</p>
                                <strong>{{
                                    formatGold(trade.buyTradeValue)
                                }}</strong>
                                <span>
                                  {{ formatUnits(trade.buyUnits) }} un · fee {{ formatPercent(trade.buyFee) }}</span
                                >
                            </div>
                            <div class="cell">
                                <p>Sell order</p>
                                <strong>{{ formatGold(trade.tradeValue) }}</strong>
                                <span>
                                    {{ formatUnits(trade.sellUnits) }} un · fee
                                    {{ formatPercent(trade.sellFee) }}
                                </span
                                >
                            </div>
                            <div class="cell">
                                <p>Fees</p>
                                <strong>{{ formatGold( derived.cumulativeFees ?? trade.totalFees) }}</strong>
                                <span>Herdadas:{{ formatGold(trade.inheritedFees) }}</span>
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
    </div>
</template>

<style>
body {
    margin: 0;
    padding: 0;
    position: relative;
}

.layout {
    max-width: 100dvw;
    min-height: 100dvh;
    background-color: #060608;
    margin: 0 auto;
    position: sticky;
    font-family:
        "Inter",
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;
    color: #0c0c14;
}

.hero {
    position: sticky;
    top: 0;
    z-index: 10;
    background: rgba(3, 3, 5, 0.9);
    color: #f8fafc;
    border-bottom: solid 1px #3b1725;
    padding: 8px;
    display: flex;
    align-items: center;
    margin-bottom: 40px;
    justify-content: space-between;
    gap: 16px;
    backdrop-filter: blur(10px);
    box-shadow: 0 6px 28px rgba(0, 0, 0, 0.25);
}

.hero__left {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.logo-mark {
    width: 40px;
    height: 40px;
}

.hero__actions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
}

.hero__github {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 999px;
    border: 1px solid #3b1725;
    background: radial-gradient(circle at 15% 20%, #0f172a, #0a0f1c);
    color: #e2e8f0;
    text-decoration: none;
    font-weight: 700;
    letter-spacing: 0.2px;
    transition:
        border-color 0.2s ease,
        color 0.2s ease,
        box-shadow 0.2s ease;
}

.hero__github:hover {
    border-color: #0ea5e9;
    color: #ffffff;
    box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}

.hero__github-icon {
    width: 18px;
    height: 18px;
}

.about__content {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.about__block {
    padding: 14px;
    border: 1px solid #1f2937;
    background: radial-gradient(circle at 0% 0%, #0d1425, #09060f 60%);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
    display: grid;
    gap: 8px;
}

.about__label {
    margin: 0;
    color: #94a3b8;
    font-weight: 700;
    letter-spacing: 0.2px;
    text-transform: uppercase;
    font-size: 12px;
}

.about__block h3 {
    margin: 0;
    color: #e2e8f0;
}

.about__block p {
    margin: 0;
    color: #cbd5e1;
}

.about__list {
    margin: 0;
    padding-left: 18px;
    color: #e2e8f0;
    display: grid;
    gap: 6px;
}

.about__list li {
    line-height: 1.4;
}

.hero__filter {
    display: grid;
    gap: 6px;
}

.hero__filter label {
    color: #94a3b8;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.2px;
    text-transform: uppercase;
}

.hero h1 {
    margin: 6px 0 8px;
    font-size: 28px;
}

.subtitle {
    margin: 0;
    color: rgba(248, 250, 252, 0.8);
    max-width: 720px;
}

.eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
    font-size: 22px;
    color: #ffffff90;
    margin: 0 0 0;
}

.hero__badge {
    background: rgba(15, 118, 110, 0.25);
    border: 1px solid rgba(16, 185, 129, 0.5);
    padding: 10px 14px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
}

.dot {
    width: 10px;
    height: 10px;
    background: #22c55e;
    display: inline-block;
    box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.25);
}

.main-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 18px;
    margin: 18px 0 24px;
}

.panel {
    border: 1px solid #333941;
    color: #ffffff;
    overflow: hidden;
    max-width: 90dvw;
    margin: 0 auto;
    background: #000000;
}

.panel__header {
    padding: 20px;
    border-bottom: 1px solid #333941;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.panel__header__title {
    display: grid;
    gap: 6px;
}

.panel__title-row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}

.panel__actions {
    display: flex;
    gap: 8px;
}

.panel__toggle {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-radius: 999px;
    border: 1px solid #1f2937;
    background: radial-gradient(circle at 20% 20%, #0f172a, #0a0f1c);
    color: #e2e8f0;
    cursor: pointer;
    transition:
        border-color 0.2s ease,
        background-color 0.2s ease,
        color 0.2s ease,
        box-shadow 0.2s ease;
}

.panel__toggle:hover {
    border-color: #0ea5e9;
    color: #ffffff;
    box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}

.panel__toggle:active {
    transform: translateY(1px);
}

.panel__toggle-icon {
    width: 16px;
    height: 16px;
    transform: rotate(-90deg);
    transition: transform 0.2s ease;
}

.panel__toggle-icon.is-open {
    transform: rotate(0deg);
}

.panel__toggle span {
    font-weight: 700;
    letter-spacing: 0.2px;
}

.panel__header h2 {
    margin: 0;
    font-size: 18px;
}

.panel__body {
    padding: 20px;
}

.form {
    display: grid;
    gap: 14px;
}

.field {
    display: grid;
    padding: 5px;
}

.field > div {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.field.two-col {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px;
}

.field label {
    margin-right: 5px;
}

.autocomplete {
    position: relative;
}

.suggestions {
    position: absolute;
    left: 0;
    right: 0;
    margin: 4px 0 0;
    padding: 4px;
    list-style: none;
    border: 1px solid #cbd5e1;
    background: #030305;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
    max-height: 220px;
    overflow-y: auto;
    z-index: 5;
}

.suggestions li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 10px;
    cursor: pointer;
    transition: background 0.1s ease;
}

.suggestions li:hover,
.suggestions li.active {
    background-color: #030305;
}

.suggestions__hint {
    color: #0284c7;
    background-color: #030305;
    font-size: 12px;
    font-weight: 600;
}

.field.two-col {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
}

label {
    font-weight: 600;
    color: #0f172a;
}

input,
select,
textarea {
    border: 1px solid #cbd5e1;
    padding: 10px 12px;
    font-size: 14px;
    background: #030305;
    transition:
        border-color 0.2s,
        box-shadow 0.2s;
}

input:focus,
select:focus,
textarea:focus {
    outline: none;
    border-color: #0284c7;
    box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.25);
}

textarea {
    resize: vertical;
}

.helper {
    margin: 4px 0 0;
    color: #64748b;
    font-size: 12px;
}

.actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
}

.hint {
    color: #ffffff;
}

.primary,
.ghost,
.danger {
    border: none;
    padding: 10px 14px;
    font-weight: 700;
    cursor: pointer;
    transition:
        transform 0.1s ease,
        box-shadow 0.1s ease,
        background 0.2s;
}

.primary {
    background: #030305;
    border: solid 1px #3b1725;
    color: #ffffff;
}

.primary:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    box-shadow: none;
}

.ghost {
    background: #030305;
    color: #ffffff90;
    border: solid 1px #3b1725;
}

.ghost.icon {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    position: relative;
    padding-left: 12px;
}

.ghost.icon::before {
    content: "⚙";
    font-size: 14px;
    position: absolute;
    left: 8px;
}

.ghost.inline {
    align-self: flex-start;
    margin-top: 4px;
    padding: 6px 10px;
}

.danger {
    background: #991b1b;
    color: #ffffff;
}

.primary:hover:not(:disabled),
.ghost:hover,
.danger:hover {
    transform: translateY(-1px);
}

.metrics {
    margin-top: 18px;
    display: grid;
    gap: 10px;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.metric {
    padding: 12px;
    border: 1px solid #e2e8f0;
    background: #030305;
    color: #0c0c14;
}

.metrics .metric > strong {
    color: #ffffff;
}

.metrics .metric p {
    color: #ffffff;
}

.metric p {
    margin: 0;
    color: #475569;
    font-weight: 600;
}

.metric strong {
    display: block;
    margin-top: 6px;
    font-size: 16px;
    color: #0f172a;
}

.metric span {
    color: #64748b;
    font-size: 12px;
}

.metric.highlight {
    border-color: #16a34a;
    background: linear-gradient(135deg, #0a2f24, #0f3d2d);
}

.metric.highlight.is-positive {
    border-color: #16a34a;
    background: linear-gradient(135deg, #0a2f24, #0f3d2d);
}

.metric.highlight.is-negative {
    border-color: #ef4444;
    background: linear-gradient(135deg, #321016, #40131b);
}

.metric.highlight span {
    color: #ffffff;
}

.status {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.trade-list {
    display: grid;
    gap: 12px;
}

.trade-card {
    padding: 14px;
    background: #030305;
    transition: 500ms background;
}

.trade-card:hover {
    background: radial-gradient(circle at 0% 0%, #0d1425, #09060f 60%);
    border-radius: 5px;
}

.trade-card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
}

.trade-card__header h3 {
    margin: 4px 0 0;
  color: #ffffff95;
}

.card-actions {
    display: none;
    gap: 6px;
    flex-wrap: wrap;
}

.trade-card:hover .card-actions {
    display: flex;
}

.trade-card__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 10px;
}

.totals-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
}

.total-card {
    border-radius: 6px;
    padding: 14px;
    background: radial-gradient(circle at 0% 0%, #0d1425, #09060f 60%);
    border: 1px solid #1f2937;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
    display: grid;
    gap: 6px;
}

.total-card--positive {
    border-color: #16a34a;
    box-shadow: 0 0 0 1px rgba(22, 163, 74, 0.35);
}

.total-card--negative {
    border-color: #b91c1c;
    box-shadow: 0 0 0 1px rgba(185, 28, 28, 0.35);
}

.total-card__label {
    margin: 0;
    color: #94a3b8;
    font-weight: 700;
    letter-spacing: 0.2px;
    text-transform: uppercase;
    font-size: 12px;
}

.total-card__value {
    margin: 0;
    color: #e2e8f0;
    font-weight: 800;
    font-size: 22px;
}

.total-card--positive .total-card__value {
    color: #22c55e;
}

.total-card--negative .total-card__value {
    color: #f87171;
}

.total-card__meta {
    margin: 0;
    color: #64748b;
    font-size: 12px;
}

.charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
}

.chart-card {
    border-radius: 3px;
    padding: 12px;
    background: #030305;
    display: grid;
    gap: 10px;
}

.chart-card__header {
    display: grid;
    grid-template-columns: 1fr;
    align-items: center;
    gap: 6px;
    font-weight: 700;
}

.chart-card__header p {
    margin: 0;
    color: #475569;
    font-weight: 600;
}

.chart-card__header strong {
    color: #ffffff;
}

.chart-card__header span {
    font-size: 12px;
    font-weight: 700;
}

.chart-card__header .positive {
    color: #16a34a;
}

.chart-card__header .negative {
    color: #b91c1c;
}

.sparkline {
    width: 100%;
    height: 80px;
}

.sparkline__stroke {
    fill: none;
    stroke: #0ea5e9;
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
}

.hidden-file-input {
    display: none;
}

.cell {
    padding: 10px;
    border: 1px solid #e2e8f030;
    border-radius: 3px;
}

.cell p {
    margin: 0;
    color: #ffffff90;
    font-weight: 600;
}

.cell strong {
    display: block;
    color: #ffffff90;
    margin-top: 4px;
}

.cell span {
    color: #64748b;
    font-size: 12px;
}

.real-profit-cell {
    border: none;
    background: linear-gradient(135deg, #0a2f24, #0f3d2d);
    color: #ffffff;
}

.real-profit-cell.is-negative {
    background: linear-gradient(135deg, #321016, #40131b);
}

.real-profit-cell.is-positive {
    background: linear-gradient(135deg, #0a2f24, #0f3d2d);
}

.error {
    color: #b91c1c;
}

.success {
    color: #047857;
    font-weight: 700;
}

.modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    z-index: 20;
}

.modal {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    max-width: 80dvw;
    width: 100%;
    overflow: hidden;
}

.modal--wide {
    max-width: 80dvw;
}

.modal__header {
    padding: 14px 16px;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: #030305;
    gap: 10px;
}

.modal__header h3 {
    margin: 2px 0 0;
    color: #64748b;
}

.modal__body {
    padding: 16px;
    display: grid;
    gap: 12px;
    background-color: #030305;
}

.modal__footer {
    padding: 12px 16px 16px;
    display: flex;
    justify-content: flex-end;
    background-color: #030305;
}

@media (max-width: 900px) {
    .main-grid {
        grid-template-columns: 1fr;
    }

    .hero {
        flex-direction: column;
        align-items: flex-start;
    }
}

label {
    color: #ffffff;
}

textarea,
select,
button,
input {
    border-radius: 3px;
    border: solid 1px #3b1725;
    background: #030305;
    color: #ffffff;
}
</style>
