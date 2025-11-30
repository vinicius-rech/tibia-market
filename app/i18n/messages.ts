export type LocaleKey = "en" | "pt";

type Messages = {
  meta: {
    nativeName: string;
    flag: string;
  };
  common: {
    appName: string;
    allItems: string;
    show: string;
    hide: string;
    close: string;
    loading: string;
    collapse: string;
    expand: string;
    github: string;
  };
  hero: {
    language: string;
    newTrade: string;
    fees: string;
    backup: string;
  };
  about: {
    eyebrow: string;
    title: string;
    whatLabel: string;
    description: string;
    howLabel: string;
    quickstart: string;
    steps: string[];
    disclaimerTitle: string;
    disclaimerBody: string;
  };
  backup: {
    eyebrow: string;
    title: string;
    helper: string;
    export: string;
    import: string;
    success: string;
    errorPrefix: string;
    reset: string;
    resetConfirm: string;
  };
  fee: {
    eyebrow: string;
    title: string;
    helper: string;
    recalculation: string;
    buyLabel: string;
    sellLabel: string;
  };
  totals: {
    eyebrow: string;
    title: string;
    collapseTitle: string;
    expandTitle: string;
    noTrades: string;
    noFiltered: string;
    value: {
      label: string;
      meta: string;
    };
    fees: {
      label: string;
      meta: string;
    };
    realProfit: {
      label: string;
      meta: string;
    };
    undercuts: {
      label: string;
      meta: string;
    };
    trades: {
      label: string;
      meta: string;
    };
  };
  charts: {
    eyebrow: string;
    title: string;
    collapseTitle: string;
    expandTitle: string;
    empty: string;
    cards: {
      profit: string;
      spread: string;
      buyValue: string;
      sellValue: string;
      fees: string;
      units: string;
    };
  };
  tradesPanel: {
    eyebrow: string;
    title: string;
    collapseTitle: string;
    expandTitle: string;
    loading: string;
    empty: string;
    emptyFiltered: string;
    actions: {
      undercut: string;
      edit: string;
      delete: string;
    };
    card: {
      bidAsk: string;
      spread: string;
      buyOrder: string;
      sellOrder: string;
      fees: string;
      inherited: string;
      recorded: string;
      realProfit: string;
      unitFee: string;
    };
  };
  tradeModal: {
    itemLabel: string;
    eyebrowNew: string;
    eyebrowEdit: string;
    defaultTitle: string;
    registerItem: string;
    helper: string;
    bid: string;
    ask: string;
    buyUnits: string;
    sellUnits: string;
    undercut: string;
    noUndercut: string;
    undercutFeesLabel: string;
    undercutHelp: string;
    duplicateLabel: string;
    duplicateHelp: string;
    note: string;
    notePlaceholder: string;
    summary: {
      spread: string;
      profit: string;
      realProfit: string;
      hint: string;
      saveLoading: string;
      saveEdit: string;
      saveNew: string;
    };
    metrics: {
      spread: string;
      buyValue: string;
      buyFeeHint: string;
      tradeValue: string;
      sellFeeHint: string;
      totalFees: string;
      totalFeesHint: string;
      profit: string;
      profitHint: string;
      realProfit: string;
      realProfitHint: string;
    };
  };
  tradeHelpers: {
    confirmDelete: string;
    parentPrimary: string;
    parentUndercut: string;
    parentMissing: string;
  };
};

export const messages: Record<LocaleKey, Messages> = {
  en: {
    meta: {
      nativeName: "English",
      flag: "🇺🇸",
    },
    common: {
      appName: "Tibia Artisan Studio",
      allItems: "All items",
      show: "Show",
      hide: "Hide",
      close: "Close",
      loading: "Loading...",
      collapse: "Collapse section",
      expand: "Expand section",
      github: "Github",
    },
    hero: {
      language: "Language",
      newTrade: "New order",
      fees: "Fees",
      backup: "Backup",
    },
    about: {
      eyebrow: "About",
      title: "How the tool works",
      whatLabel: "What it is",
      description:
        "Local dashboard to simulate, save, and track Tibia market trades with fee calculations, spread, and undercut chains.",
      howLabel: "How to use",
      quickstart: "Quickstart",
      steps: [
        "Pick an item (or register a new name) and fill bid/ask and units.",
        "Adjust global or per-order fees; the summary calculates spread, fees, and real profit before saving.",
        'Save the order. Use "Create undercut" to inherit fees and keep the history linked.',
        "Filter by item in totals, charts, and history to compare performance.",
        "Use backup to export/import your local data or reset to start fresh.",
      ],
      disclaimerTitle: "Disclaimer",
      disclaimerBody:
        "Tibia is a registered trademark of CipSoft GmbH. This project is a community tool with no affiliation, endorsement, or partnership with CipSoft. All rights to the name Tibia and related assets belong to their respective owners.",
    },
    backup: {
      eyebrow: "Backup",
      title: "Export or import data",
    helper: "Export your local database to JSON or import an existing file.",
    export: "Export backup",
    import: "Import backup",
    success: "Using local data.",
    errorPrefix: "Error",
    reset: "Reset local database",
    resetConfirm: "Are you sure you want to delete all data? This action is irreversible.",
  },
    fee: {
      eyebrow: "Global fees",
      title: "Default buy and sell fees",
      helper: "These fees apply to every order (new or edited).",
      recalculation:
        "Recalculation considers inherited undercut fees plus these global fees.",
      buyLabel: "Buy fee (%)",
      sellLabel: "Sell fee (%)",
    },
    totals: {
      eyebrow: "Summary",
      title: "Consolidated totals",
      collapseTitle: "Collapse totals panel",
      expandTitle: "Expand totals panel",
      noTrades: "Register orders to see consolidated totals.",
      noFiltered: "No orders found for this filter.",
      value: {
        label: "Sell value",
        meta: "Sum of trade value for filtered orders.",
      },
      fees: {
        label: "Fees paid",
        meta: "All time (direct and inherited fees).",
      },
      realProfit: {
        label: "Real profit",
        meta: "Accumulated net profit.",
      },
      undercuts: {
        label: "Undercuts",
        meta: "Orders with an undercut reference.",
      },
      trades: {
        label: "Trades",
        meta: "Total count for the filter.",
      },
    },
    charts: {
      eyebrow: "Insights",
      title: "Quick charts",
      collapseTitle: "Collapse charts",
      expandTitle: "Expand charts",
      empty: "Register orders to view history and trends.",
      cards: {
        profit: "Real profit",
        spread: "Spread",
        buyValue: "Buy value",
        sellValue: "Sell value",
        fees: "Fees",
        units: "Total units",
      },
    },
    tradesPanel: {
      eyebrow: "Orders",
      title: "History",
      collapseTitle: "Collapse history",
      expandTitle: "Expand history",
      loading: "Loading...",
      empty: "No orders registered.",
      emptyFiltered: "No orders for the selected filter.",
      actions: {
        undercut: "Create undercut",
        edit: "Edit",
        delete: "Delete",
      },
      card: {
        bidAsk: "Bid / Ask",
        spread: "Spread",
        buyOrder: "Buy order",
        sellOrder: "Sell order",
        fees: "Fees",
        inherited: "Inherited",
        recorded: "Recorded",
        realProfit: "Real Profit",
        unitFee: "{units} units · fee {fee}",
      },
    },
    tradeModal: {
      itemLabel: "Item",
      eyebrowNew: "New order",
      eyebrowEdit: "Edit order #{id}",
      defaultTitle: "Set the item",
      registerItem: 'Register "{item}"',
      helper: "Use arrows or Tab to complete suggestions.",
      bid: "Bid (buy)",
      ask: "Ask (sell)",
      buyUnits: "Buy units",
      sellUnits: "Sell units",
      undercut: "Undercut (optional)",
      noUndercut: "No undercut",
      undercutFeesLabel: "inherited fees:",
      undercutHelp:
        "Choose an order to chain an undercut and bring accumulated fees into real profit.",
      duplicateLabel: "Duplicate orders (count)",
      duplicateHelp:
        "Creates independent copies when saving. Ignored while editing. Limit of {limit} copies.",
      note: "Note",
      notePlaceholder: "Ex: relisted after undercut, price adjustment, etc",
      summary: {
        spread: "Spread",
        profit: "Profit",
        realProfit: "Real profit",
        hint: "Real profit includes all inherited fees in the chain.",
        saveLoading: "Saving...",
        saveEdit: "Save edit",
        saveNew: "Save order",
      },
      metrics: {
        spread: "Spread",
        buyValue: "Buy trade value",
        buyFeeHint: "{units} units · fee {fee}%",
        tradeValue: "Trade value",
        sellFeeHint: "{units} units · fee {fee}%",
        totalFees: "Total fees",
        totalFeesHint: "Includes buy + sell",
        profit: "Profit",
        profitHint: "Gross profit (before fees)",
        realProfit: "Real profit",
        realProfitHint: "Net profit (fees + inherited)",
      },
    },
    tradeHelpers: {
      confirmDelete:
        "Remove order #{id}? Children will lose the undercut reference.",
      parentPrimary: "Primary",
      parentUndercut: "Undercut of #{id} ({item})",
      parentMissing: "Undercut (reference not found)",
    },
  },
  pt: {
    meta: {
      nativeName: "Português",
      flag: "🇧🇷",
    },
    common: {
      appName: "Tibia Artisan Studio",
      allItems: "Todos os itens",
      show: "Mostrar",
      hide: "Esconder",
      close: "Fechar",
      loading: "Carregando...",
      collapse: "Recolher seção",
      expand: "Expandir seção",
      github: "Github",
    },
    hero: {
      language: "Idioma",
      newTrade: "Nova ordem",
      fees: "Taxas",
      backup: "Backup",
    },
    about: {
      eyebrow: "Sobre",
      title: "Como a ferramenta funciona",
      whatLabel: "O que é",
      description:
        "Dashboard local para simular, salvar e acompanhar trades do mercado do Tibia com cálculo de fees, spread e encadeamento de undercuts.",
      howLabel: "Como usar",
      quickstart: "Passo a passo rápido",
      steps: [
        "Escolha um item (ou cadastre um nome novo) e preencha bid/ask e unidades.",
        "Ajuste as taxas globais ou por ordem; o resumo calcula spread, fees e real profit antes de salvar.",
        'Grave a ordem. Use "Criar undercut" em qualquer trade para herdar fees e manter o histórico ligado.',
        "Filtre por item nos painéis de totais, gráficos e histórico para comparar desempenhos.",
        "Use o backup para exportar/importar os dados locais ou limpar tudo quando quiser recomeçar.",
      ],
      disclaimerTitle: "Aviso legal",
      disclaimerBody:
        "Tibia é marca registrada da CipSoft GmbH. Este projeto é uma ferramenta comunitária sem afiliação, endosso ou parceria com a CipSoft. Todos os direitos sobre o nome Tibia e ativos relacionados pertencem aos seus respectivos donos.",
    },
    backup: {
      eyebrow: "Backup",
      title: "Exportar ou importar dados",
    helper: "Exporte seu banco local para JSON ou importe um arquivo existente.",
    export: "Exportar backup",
    import: "Importar backup",
    success: "Dados locais em uso.",
    errorPrefix: "Erro",
    reset: "Resetar banco local",
    resetConfirm: "Tem certeza que deseja apagar todos os dados? Esta ação é irreversível.",
  },
    fee: {
      eyebrow: "Taxas globais",
      title: "Buy fee e Sell fee padrões",
      helper: "Estas taxas serão usadas em todas as ordens (novas ou editadas).",
      recalculation:
        "Recalculo dos campos considera taxas herdadas de undercut + estas taxas globais.",
      buyLabel: "Buy fee (%)",
      sellLabel: "Sell fee (%)",
    },
    totals: {
      eyebrow: "Resumo",
      title: "Totais consolidados",
      collapseTitle: "Recolher painel de totais",
      expandTitle: "Expandir painel de totais",
      noTrades: "Cadastre ordens para ver os totais consolidados.",
      noFiltered: "Nenhuma ordem encontrada para este filtro.",
      value: {
        label: "Valor vendido",
        meta: "Soma de trade value das ordens filtradas.",
      },
      fees: {
        label: "Taxas pagas",
        meta: "All time (taxas diretas e herdadas).",
      },
      realProfit: {
        label: "Real profit",
        meta: "Lucro líquido acumulado.",
      },
      undercuts: {
        label: "Undercuts",
        meta: "Ordens com referência de undercut.",
      },
      trades: {
        label: "Trades",
        meta: "Quantidade total do filtro.",
      },
    },
    charts: {
      eyebrow: "Insights",
      title: "Gráficos rápidos",
      collapseTitle: "Recolher gráficos",
      expandTitle: "Expandir gráficos",
      empty: "Cadastre ordens para visualizar histórico e tendências.",
      cards: {
        profit: "Real profit",
        spread: "Spread",
        buyValue: "Valor de compra",
        sellValue: "Valor de venda",
        fees: "Taxas",
        units: "Unidades totais",
      },
    },
    tradesPanel: {
      eyebrow: "Ordens",
      title: "Histórico",
      collapseTitle: "Recolher histórico",
      expandTitle: "Expandir histórico",
      loading: "Carregando...",
      empty: "Nenhuma ordem cadastrada.",
      emptyFiltered: "Nenhuma ordem para o filtro selecionado.",
      actions: {
        undercut: "Criar undercut",
        edit: "Editar",
        delete: "Deletar",
      },
      card: {
        bidAsk: "Bid / Ask",
        spread: "Spread",
        buyOrder: "Buy order",
        sellOrder: "Sell order",
        fees: "Fees",
        inherited: "Herdadas",
        recorded: "Registrado",
        realProfit: "Real Profit",
        unitFee: "{units} un · fee {fee}",
      },
    },
    tradeModal: {
      itemLabel: "Item",
      eyebrowNew: "Nova ordem",
      eyebrowEdit: "Editar ordem #{id}",
      defaultTitle: "Defina o item",
      registerItem: 'Cadastrar "{item}"',
      helper: "Use setas ou Tab para completar sugestões.",
      bid: "Bid (compra)",
      ask: "Ask (venda)",
      buyUnits: "Buy units",
      sellUnits: "Sell units",
      undercut: "Undercut (opcional)",
      noUndercut: "Sem undercut",
      undercutFeesLabel: "taxas herdadas:",
      undercutHelp:
        "Selecione uma ordem para encadear um undercut e trazer as taxas acumuladas para o lucro real.",
      duplicateLabel: "Duplicar ordens (quantidade)",
      duplicateHelp:
        "Cria cópias independentes ao salvar a ordem. Ignorado ao editar. Limite de {limit} cópias.",
      note: "Observação",
      notePlaceholder: "Ex: relistado após undercut, ajuste de preço, etc",
      summary: {
        spread: "Spread",
        profit: "Profit",
        realProfit: "Real profit",
        hint: "Real profit considera todas as taxas herdadas do encadeamento.",
        saveLoading: "Salvando...",
        saveEdit: "Salvar edição",
        saveNew: "Salvar ordem",
      },
      metrics: {
        spread: "Spread",
        buyValue: "Buy trade value",
        buyFeeHint: "{units} un · fee {fee}%",
        tradeValue: "Trade value",
        sellFeeHint: "{units} un · fee {fee}%",
        totalFees: "Total fees",
        totalFeesHint: "Inclui compra + venda",
        profit: "Profit",
        profitHint: "Lucro bruto (antes das taxas)",
        realProfit: "Real profit",
        realProfitHint: "Lucro líquido (taxas + herdadas)",
      },
    },
    tradeHelpers: {
      confirmDelete:
        "Remover ordem #{id}? Filhos vão perder o link de undercut.",
      parentPrimary: "Primária",
      parentUndercut: "Undercut de #{id} ({item})",
      parentMissing: "Undercut (referência não encontrada)",
    },
  },
};

export const defaultLocale: LocaleKey = "en";
