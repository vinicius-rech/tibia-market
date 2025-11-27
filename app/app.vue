<script setup lang="ts">
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
const globalBuyFeePct = ref(1);
const globalSellFeePct = ref(2);
const showSuggestions = ref(false);
const highlightedSuggestion = ref(0);
const SUGGESTION_LIMIT = 8;
let hideSuggestionsTimeout: number | null = null;

const form = reactive<TradeInput>({
    item: "",
    bid: 0,
    ask: 0,
    buyUnits: 1,
    sellUnits: 1,
    parentTradeId: null,
    note: "",
});

const parentFee = computed(() => {
    if (!form.parentTradeId) {
        return 0;
    }

    const parent = trades.value.find(
        (trade) => trade.id === form.parentTradeId,
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
    const profit = tradeValue - buyTradeValue - totalFees;
    const cumulativeFees = totalFees + inheritedFees;
    const realProfit = tradeValue - buyTradeValue - cumulativeFees;

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

watch([globalBuyFeePct, globalSellFeePct], ([buy, sell]) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
        "tibia-trader-fees",
        JSON.stringify({ buyFeePct: buy, sellFeePct: sell }),
    );
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
            form.parentTradeId,
            form.note?.trim() || null,
        ];

        const isEditing = editingTradeId.value !== null;
        const query = isEditing
            ? `
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
      `
            : `
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

        const params = isEditing ? [...values, editingTradeId.value] : values;

        const result = await $pglite.query<TradeRow>(query, params);
        const saved = mapTradeRow(result.rows[0]);

        if (isEditing) {
            trades.value = trades.value.map((trade) =>
                trade.id === saved.id ? saved : trade,
            );
            editingTradeId.value = null;
        } else {
            trades.value.unshift(saved);
        }

        resetForm(saved.item);
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

    if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
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
    if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
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
            .map((trade) =>
                trade.parentTradeId === tradeId
                    ? { ...trade, parentTradeId: null }
                    : trade,
            )
            .filter((trade) => trade.id !== tradeId);

        await loadTrades();
    } catch (err) {
        error.value = err instanceof Error ? err.message : String(err);
    }
}

function describeParent(trade: Trade) {
    if (!trade.parentTradeId) {
        return "Ordem primaria";
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
        <header class="hero">
            <div class="hero__left">
                <p class="eyebrow">
                    <img class="logo-mark" src="/tmd-logo.svg" alt="TMD" />
                    Tibia Market Desk
                </p>
                <!-- <h1>Ordens de compra, venda e undercut</h1>
                <p class="subtitle">
                    Lance compras e vendas com bid/ask, taxas, spread e undercut
                    encadeado. Os calculos aparecem antes de salvar no banco.
                </p> -->
            </div>
            <div class="hero__actions">
                <button
                    class="ghost"
                    type="button"
                    @click="showFeeModal = true"
                >
                    Taxas
                </button>
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
                        class="ghost icon"
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

        <main class="main-grid">
            <section class="panel">
                <div class="panel__header">
                    <div>
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
                    </div>
                </div>
                <div class="panel__body">
                    <form class="form" @submit.prevent="submitTrade">
                        <div class="field">
                            <label>Item</label>
                            <div class="autocomplete"">
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
                                    @keydown.down.prevent="moveSuggestion(1)"
                                    @keydown.up.prevent="moveSuggestion(-1)"
                                    @keydown.delete="handleDeleteSuggestion"
                                    @keydown.tab="handleTabComplete"
                                />
                                <ul
                                    v-if="
                                        showSuggestions && filteredItems.length
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
                                                highlightedSuggestion === index,
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
                                                highlightedSuggestion === index
                                            "
                                            class="suggestions__hint"
                                        >
                                            Tab para completar
                                        </span>
                                    </li>
                                </ul>
                            </div>
                            <p class="helper">
                                Busca itens ja cadastrados, prioriza prefixos e
                                permite completar com Tab.
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
                                    min="1"
                                    step="1"
                                    required
                                />
                            </div>
                            <div>
                                <label>Sell units</label>
                                <input
                                    v-model.number="form.sellUnits"
                                    type="number"
                                    min="1"
                                    step="1"
                                    required
                                />
                            </div>
                        </div>
                        <div class="field">
                            <label>Undercut (opcional)</label>
                            <select v-model="form.parentTradeId">
                                <option :value="null">Sem undercut</option>
                                <option
                                    v-for="trade in trades"
                                    :key="trade.id"
                                    :value="trade.id"
                                    :disabled="editingTradeId === trade.id"
                                >
                                    #{{ trade.id }} · {{ trade.item }} · taxas
                                    herdadas:
                                    {{ formatGold(trade.cumulativeFees) }}
                                </option>
                            </select>
                            <p class="helper">
                                Selecione uma ordem para encadear um undercut e
                                trazer as taxas acumuladas para o lucro real.
                            </p>
                        </div>
                        <div class="field">
                            <label>Observacao</label>
                            <textarea
                                v-model="form.note"
                                rows="2"
                                placeholder="Ex: relistado apos undercut, ajuste de preco, etc"
                            ></textarea>
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
                            <strong>{{
                                formatGold(derived.buyTradeValue)
                            }}</strong>
                            <span
                                >{{ formatUnits(form.buyUnits) }} un · fee
                                {{ derived.buyFee * 100 }}%</span
                            >
                        </div>
                        <div class="metric">
                            <p>Trade value</p>
                            <strong>{{
                                formatGold(derived.tradeValue)
                            }}</strong>
                            <span
                                >{{ formatUnits(form.sellUnits) }} un · fee
                                {{ derived.sellFee * 100 }}%</span
                            >
                        </div>
                        <div class="metric">
                            <p>Total fees</p>
                            <strong>{{ formatGold(derived.totalFees) }}</strong>
                            <span>Inclui compra + venda</span>
                        </div>
                        <div class="metric">
                            <p>Profit</p>
                            <strong>{{ formatGold(derived.profit) }}</strong>
                            <span>Sem undercut herdado</span>
                        </div>
                        <div class="metric highlight">
                            <p>Real profit</p>
                            <strong>{{
                                formatGold(derived.realProfit)
                            }}</strong>
                            <span
                                >?? Taxas herdadas:
                                {{
                                    formatGold(
                                        derived.cumulativeFees -
                                            derived.totalFees,
                                    )
                                }}</span
                            >
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
        </main>

        <section class="panel trades">
            <div class="panel__header">
                <div>
                    <p class="eyebrow">Historico</p>
                    <h2>Ordens registradas</h2>
                </div>
            </div>
            <div class="panel__body">
                <p v-if="loading">Carregando...</p>
                <p v-else-if="trades.length === 0">Nenhuma ordem cadastrada.</p>
                <div v-else class="trade-list">
                    <article
                        v-for="trade in trades"
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
                                <p>Bid / Ask</p>
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
                                <span
                                    >{{ formatUnits(trade.buyUnits) }} un · fee
                                    {{ formatPercent(trade.buyFee) }}</span
                                >
                            </div>
                            <div class="cell">
                                <p>Sell order</p>
                                <strong>{{
                                    formatGold(trade.tradeValue)
                                }}</strong>
                                <span
                                    >{{ formatUnits(trade.sellUnits) }} un · fee
                                    {{ formatPercent(trade.sellFee) }}</span
                                >
                            </div>
                            <div class="cell">
                                <p>Fees</p>
                                <strong>{{
                                    formatGold(trade.totalFees)
                                }}</strong>
                                <span
                                    >Herdadas:
                                    {{ formatGold(trade.inheritedFees) }}</span
                                >
                            </div>
                            <div class="cell">
                                <p>Profit</p>
                                <strong>{{ formatGold(trade.profit) }}</strong>
                                <span
                                    >Real:
                                    {{ formatGold(trade.realProfit) }}</span
                                >
                            </div>
                            <div class="cell">
                                <p>Registrado</p>
                                <strong>{{
                                    new Date(trade.createdAt).toLocaleString(
                                        "pt-BR",
                                    )
                                }}</strong>
                                <span v-if="trade.note">{{ trade.note }}</span>
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
    max-width: 100%;
    margin: 0 auto;
    background-color: #1f2937;
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
    background: linear-gradient(120deg, #0ea5e9, #0ea5e9 60%, #00a509);
    color: #f8fafc;
    padding: 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.25);
}

.hero__left {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.logo-mark {
    width: 40px;
    height: 40px;
    box-shadow: 0 10px 30px rgba(14, 165, 233, 0.25);
}

.hero__actions {
    display: flex;
    align-items: center;
    gap: 10px;
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
    color: #ffffff;
    margin: 0 0 4px;
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
    border: 1px solid #e2e8f0;
    overflow: hidden;
    background: #ffffff;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
}

.panel__header {
    padding: 16px 20px;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.panel__actions {
    display: flex;
    gap: 8px;
}

.panel__header h2 {
    margin: 0;
    font-size: 18px;
}

.panel__body {
    padding: 20px;
}

.panel.trades .panel__body {
    padding: 16px;
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
    background: #ffffff;
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
    background: #e0f2fe;
}

.suggestions__hint {
    color: #0284c7;
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
    background: #f8fafc;
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
    color: #0f172a;
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
    background: linear-gradient(90deg, #0ea5e9, #14b8a6);
    color: #ffffff;
    box-shadow: 0 8px 22px rgba(14, 165, 233, 0.35);
}

.primary:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    box-shadow: none;
}

.ghost {
    background: #e2e8f0;
    color: #0f172a;
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
    background: #fee2e2;
    color: #991b1b;
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
    background: #f8fafc;
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
    background: linear-gradient(180deg, #ecfeff, #f5f3ff);
    border-color: #c4b5fd;
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
    border: 1px solid #e2e8f0;
    padding: 14px;
    background: #fff;
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
}

.card-actions {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
}

.trade-card__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 10px;
}

.cell {
    padding: 10px;
    border: 1px dashed #e2e8f0;
}

.cell p {
    margin: 0;
    color: #475569;
    font-weight: 600;
}

.cell strong {
    display: block;
    margin-top: 4px;
}

.cell span {
    color: #64748b;
    font-size: 12px;
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
    max-width: 520px;
    width: 100%;
    box-shadow: 0 20px 40px rgba(15, 23, 42, 0.2);
    overflow: hidden;
}

.modal__header {
    padding: 14px 16px;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
}

.modal__header h3 {
    margin: 2px 0 0;
}

.modal__body {
    padding: 16px;
    display: grid;
    gap: 12px;
}

.modal__footer {
    padding: 12px 16px 16px;
    display: flex;
    justify-content: flex-end;
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

textarea,
select,
button,
input {
    border-radius: 3px;
}

</style>
