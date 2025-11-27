import { PGlite } from "@electric-sql/pglite";

// Use direct file URLs to avoid package export limits when bundling.
const fsBundleUrl = new URL(
  "../../node_modules/@electric-sql/pglite/dist/pglite.data",
  import.meta.url,
).href;
const wasmUrl = new URL(
  "../../node_modules/@electric-sql/pglite/dist/pglite.wasm",
  import.meta.url,
).href;

async function loadWasm(url: string) {
  const response = await fetch(url);

  if (WebAssembly.compileStreaming) {
    try {
      return await WebAssembly.compileStreaming(response.clone());
    } catch {
      // Fallback for browsers that mis-report streaming support
    }
  }

  const buffer = await response.arrayBuffer();
  return await WebAssembly.compile(buffer);
}

export default defineNuxtPlugin(async () => {
  const [fsBundle, wasmModule] = await Promise.all([
    fetch(fsBundleUrl).then((res) => res.blob()),
    loadWasm(wasmUrl),
  ]);

  const db = new PGlite("idb://tibia-trader", {
    fsBundle,
    wasmModule,
  });

  await db.waitReady;

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      name TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS trades (
      id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      item TEXT NOT NULL,
      bid DOUBLE PRECISION NOT NULL,
      ask DOUBLE PRECISION NOT NULL,
      spread DOUBLE PRECISION NOT NULL,
      buy_fee DOUBLE PRECISION NOT NULL,
      sell_fee DOUBLE PRECISION NOT NULL,
      buy_units DOUBLE PRECISION NOT NULL,
      sell_units DOUBLE PRECISION NOT NULL,
      buy_trade_value DOUBLE PRECISION NOT NULL,
      trade_value DOUBLE PRECISION NOT NULL,
      total_fees DOUBLE PRECISION NOT NULL,
      profit DOUBLE PRECISION NOT NULL,
      inherited_fees DOUBLE PRECISION NOT NULL DEFAULT 0,
      cumulative_fees DOUBLE PRECISION NOT NULL,
      real_profit DOUBLE PRECISION NOT NULL,
      parent_trade_id INTEGER REFERENCES trades(id) ON DELETE SET NULL,
      note TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  return {
    provide: {
      pglite: db,
    },
  };
});
