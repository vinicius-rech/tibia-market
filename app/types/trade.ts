export type TradeRow = {
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

export type ItemRow = {
  name: string;
};

export type TradeInput = {
  item: string;
  bid: number;
  ask: number;
  buyUnits: number;
  sellUnits: number;
  parentTradeId: number | null;
  note: string;
  duplicationCount: number;
};

export type Trade = {
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

export type Metrics = {
  spread: number;
  buyTradeValue: number;
  tradeValue: number;
  totalFees: number;
  profit: number;
  inheritedFees: number;
  cumulativeFees: number;
  realProfit: number;
  buyFee: number;
  sellFee: number;
};
