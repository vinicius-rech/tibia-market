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
    filterLabel: string;
    filterHelp: string;
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
    buyTooltip: string;
    sellTooltip: string;
  };
  totals: {
    eyebrow: string;
    title: string;
    collapseTitle: string;
    expandTitle: string;
    noTrades: string;
    noFiltered: string;
    filterLabel: string;
    filterHelp: string;
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
    filterLabel: string;
    filterHelp: string;
    cards: {
      profit: string;
      spread: string;
      buyValue: string;
      sellValue: string;
      fees: string;
      units: string;
    };
    cardsHints: {
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
    filterLabel: string;
    filterHelp: string;
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
    cardHelp: {
      bidAsk: string;
      buyOrder: string;
      sellOrder: string;
      fees: string;
      recorded: string;
      realProfit: string;
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
    fieldHelp: {
      item: string;
      bid: string;
      ask: string;
      buyUnits: string;
      sellUnits: string;
      undercut: string;
      duplicate: string;
      note: string;
    };
    summary: {
      spread: string;
      profit: string;
      realProfit: string;
      hint: string;
      saveLoading: string;
      saveEdit: string;
      saveNew: string;
      tooltips: {
        spread: string;
        profit: string;
        realProfit: string;
      };
    };
    metrics: {
      spread: string;
      spreadHint: string;
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
      appName: "Tibia Market Ledger",
      allItems: "All market wares",
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
      newTrade: "New listing",
      fees: "Market fees",
      backup: "Backup",
      filterLabel: "Item filter",
      filterHelp: "Applies a shared item filter to totals, charts, and the log.",
    },
    about: {
      eyebrow: "About",
      title: "How this market ledger works",
      whatLabel: "What it is",
      description:
        "Local ledger to simulate, save, and track Tibia Market listings with market fees, market margin, and undercut chains.",
      howLabel: "How to use",
      quickstart: "Quickstart",
      steps: [
        "Pick a Tibia item (or register a custom name) and fill your buy/sell prices and units.",
        "Adjust market fees globally or per listing; the summary calculates market margin, fees, and net profit before saving.",
        'Save the listing. Use "Create undercut" to relist from an older entry and keep the chain linked.',
        "Filter by item in totals, charts, and history to compare flips or loot runs.",
        "Use backup to export/import your local data or reset to start fresh.",
      ],
      disclaimerTitle: "Disclaimer",
      disclaimerBody:
        "Tibia is a registered trademark of CipSoft GmbH. This project is a community tool with no affiliation, endorsement, or partnership with CipSoft. All rights to the name Tibia and related assets belong to their respective owners.",
    },
    backup: {
      eyebrow: "Backup",
      title: "Export or import data",
      helper: "Export your local ledger to JSON or import an existing file. Data never leaves your machine.",
      export: "Export backup",
      import: "Import backup",
      success: "Using local data.",
      errorPrefix: "Error",
      reset: "Reset local database",
      resetConfirm: "Are you sure you want to delete all data? This action is irreversible.",
    },
    fee: {
      eyebrow: "Market fees",
      title: "Default buy and sell fees",
      helper:
        "These fees mirror the Tibia Market cut. Change them here instead of editing every listing.",
      recalculation:
        "Recalculation considers inherited undercut fees plus these global fees.",
      buyLabel: "Buy fee (%)",
      sellLabel: "Sell fee (%)",
      buyTooltip: "Market tax charged when you buy a listing.",
      sellTooltip: "Market tax charged when you sell the listing.",
    },
    totals: {
      eyebrow: "Ledger",
      title: "Consolidated loot",
      collapseTitle: "Collapse ledger panel",
      expandTitle: "Expand ledger panel",
      noTrades: "Register listings to see consolidated totals.",
      noFiltered: "No listings found for this filter.",
      filterLabel: "Filter",
      filterHelp: "Filter totals by an item (matches charts and log filters).",
      value: {
        label: "Gold from sales",
        meta: "Sum of sale value for filtered listings.",
      },
      fees: {
        label: "Market fees paid",
        meta: "All cuts (direct and inherited).",
      },
      realProfit: {
        label: "Net profit",
        meta: "Accumulated profit after market fees.",
      },
      undercuts: {
        label: "Relists / undercuts",
        meta: "Listings linked to a parent listing.",
      },
      trades: {
        label: "Listings",
        meta: "Total count for the filter.",
      },
    },
    charts: {
      eyebrow: "Insights",
      title: "Quick charts",
      collapseTitle: "Collapse charts",
      expandTitle: "Expand charts",
      empty: "Register listings to view history and trends.",
      filterLabel: "Filter",
      filterHelp: "Choose an item to focus the charts.",
      cards: {
        profit: "Net profit",
        spread: "Market margin",
        buyValue: "Buy cost",
        sellValue: "Sale gold",
        fees: "Market fees",
        units: "Stacks moved",
      },
      cardsHints: {
        profit: "Gold kept after all market fees in the chain.",
        spread: "Gap between ask and bid; a quick proxy for expected profit per stack.",
        buyValue: "Total gold spent to buy the stacks.",
        sellValue: "Total gold gained from sales.",
        fees: "Sum of buy and sell market cuts (including inherited).",
        units: "How many units were traded in the current filter.",
      },
    },
    tradesPanel: {
      eyebrow: "Listings",
      title: "History",
      collapseTitle: "Collapse history",
      expandTitle: "Expand history",
      loading: "Loading market log...",
      empty: "No listings saved yet.",
      emptyFiltered: "No listings for the selected filter.",
      filterLabel: "Filter",
      filterHelp: "Filter the log by item (matches charts and totals).",
      actions: {
        undercut: "Relist (undercut)",
        edit: "Edit listing",
        delete: "Delete",
      },
      card: {
        bidAsk: "Buy / Sell",
        spread: "Market margin",
        buyOrder: "Buy total",
        sellOrder: "Sale total",
        fees: "Fees",
        inherited: "Inherited",
        recorded: "Logged at",
        realProfit: "Net profit",
        unitFee: "{units} units | fee {fee}",
      },
      cardHelp: {
        bidAsk: "Buy is what you pay; sell is what you list for in the Market.",
        buyOrder: "Gold spent to secure the stack (includes buy tax).",
        sellOrder: "Gold you receive before the sell tax.",
        fees: "Market fees paid plus inherited chain fees.",
        recorded: "When this listing was saved; note keeps extra context.",
        realProfit: "Gold kept after every market cut in the chain.",
      },
    },
    tradeModal: {
      itemLabel: "Item",
      eyebrowNew: "New listing",
      eyebrowEdit: "Edit listing #{id}",
      defaultTitle: "Set the item",
      registerItem: 'Register "{item}" name',
      helper: "Use arrows or Tab to complete suggestions from your saved market items.",
      bid: "Buy price (bid)",
      ask: "Sell price (ask)",
      buyUnits: "Units bought",
      sellUnits: "Units sold",
      undercut: "Parent listing (undercut)",
      noUndercut: "No undercut",
      undercutFeesLabel: "inherited fees:",
      undercutHelp:
        "Choose a saved listing to chain a relist/undercut and carry the accumulated fees.",
      duplicateLabel: "Duplicate listings (count)",
      duplicateHelp:
        "Creates independent copies when saving. Ignored while editing. Limit of {limit} copies.",
      note: "Note",
      notePlaceholder: "Ex: server, buyer, relist reason, etc",
      fieldHelp: {
        item: "Name the Tibia item exactly as you trade it in the Market.",
        bid: "Gold you paid per unit to buy the stack.",
        ask: "Gold you expect per unit when selling the stack.",
        buyUnits: "How many units you actually bought.",
        sellUnits: "How many units you will sell (usually the same amount).",
        undercut: "Link to a parent listing to track relists/undercuts and inherit fees.",
        duplicate: "Quickly create multiple copies of the same listing.",
        note: "Add context like server, buyer, hunt, or why you relisted.",
      },
      summary: {
        spread: "Market margin",
        profit: "Gross profit",
        realProfit: "Net profit",
        hint: "Net profit includes all inherited fees in the chain.",
        saveLoading: "Saving...",
        saveEdit: "Save edit",
        saveNew: "Save listing",
        tooltips: {
          spread: "Ask minus bid totals before fees.",
          profit: "Gross profit without market cuts.",
          realProfit: "Profit after market and inherited fees.",
        },
      },
      metrics: {
        spread: "Market margin",
        spreadHint: "Gap between sale and buy totals before fees.",
        buyValue: "Buy total",
        buyFeeHint: "{units} units | buy fee {fee}%",
        tradeValue: "Sale total",
        sellFeeHint: "{units} units | sell fee {fee}%",
        totalFees: "Market fees",
        totalFeesHint: "Includes buy + sell cuts (with inheritance).",
        profit: "Gross profit",
        profitHint: "Before any fee is applied.",
        realProfit: "Net profit",
        realProfitHint: "After market and inherited fees.",
      },
    },
    tradeHelpers: {
      confirmDelete:
        "Remove listing #{id}? Children will lose the undercut reference.",
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
      appName: "Livro do Market Tibiano",
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
      newTrade: "Novo anúncio",
      fees: "Taxas do Market",
      backup: "Backup",
      filterLabel: "Filtro de item",
      filterHelp: "Aplica o mesmo filtro de item nos totais, gráficos e histórico.",
    },
    about: {
      eyebrow: "Sobre",
      title: "Como o livro funciona",
      whatLabel: "O que é",
      description:
        "Painel local para simular, salvar e acompanhar anúncios do Market do Tibia com cálculo de margem de mercado, taxas e cadeias de undercut.",
      howLabel: "Como usar",
      quickstart: "Passo a passo rápido",
      steps: [
        "Escolha um item (ou cadastre um nome novo) e preencha preços de compra/venda e unidades.",
        "Ajuste as taxas globais ou por anúncio; o resumo calcula margem, taxas e lucro líquido antes de salvar.",
        'Salve o anúncio. Use "Criar undercut" para relistar a partir de outro registro mantendo o encadeamento.',
        "Filtre por item nos painéis de totais, gráficos e histórico para comparar flips ou loot.",
        "Use o backup para exportar/importar seus dados locais ou zerar tudo quando quiser recomeçar.",
      ],
      disclaimerTitle: "Aviso legal",
      disclaimerBody:
        "Tibia é marca registrada da CipSoft GmbH. Este projeto é uma ferramenta comunitária sem afiliação, endosso ou parceria com a CipSoft. Todos os direitos sobre o nome Tibia e ativos relacionados pertencem aos seus respectivos donos.",
    },
    backup: {
      eyebrow: "Backup",
      title: "Exportar ou importar dados",
      helper: "Exporte sua caderneta local para JSON ou importe um arquivo. Nada sai da sua máquina.",
      export: "Exportar backup",
      import: "Importar backup",
      success: "Dados locais em uso.",
      errorPrefix: "Erro",
      reset: "Resetar banco local",
      resetConfirm: "Tem certeza que deseja apagar todos os dados? Esta ação é irreversível.",
    },
    fee: {
      eyebrow: "Taxas do Market",
      title: "Taxas padrão de compra e venda",
      helper: "Estas taxas refletem o corte do Market. Ajuste aqui sem precisar alterar cada anúncio.",
      recalculation:
        "Recalculo dos campos considera taxas herdadas de undercut + estas taxas globais.",
      buyLabel: "Taxa de compra (%)",
      sellLabel: "Taxa de venda (%)",
      buyTooltip: "Taxa cobrada ao comprar um anúncio no Market.",
      sellTooltip: "Taxa cobrada ao vender o anúncio no Market.",
    },
    totals: {
      eyebrow: "Caderneta",
      title: "Totais do loot",
      collapseTitle: "Recolher painel de totais",
      expandTitle: "Expandir painel de totais",
      noTrades: "Cadastre anúncios para ver os totais consolidados.",
      noFiltered: "Nenhum anúncio encontrado para este filtro.",
      filterLabel: "Filtro",
      filterHelp: "Filtra os totais por um item (igual aos gráficos e histórico).",
      value: {
        label: "Gold recebido nas vendas",
        meta: "Soma do valor de venda dos anúncios filtrados.",
      },
      fees: {
        label: "Taxas pagas ao Market",
        meta: "Somatório das taxas diretas e herdadas.",
      },
      realProfit: {
        label: "Lucro líquido",
        meta: "Lucro acumulado após as taxas do Market.",
      },
      undercuts: {
        label: "Relists / undercuts",
        meta: "Anúncios ligados a uma oferta pai.",
      },
      trades: {
        label: "Anúncios",
        meta: "Quantidade total para o filtro.",
      },
    },
    charts: {
      eyebrow: "Insights",
      title: "Gráficos rápidos",
      collapseTitle: "Recolher gráficos",
      expandTitle: "Expandir gráficos",
      empty: "Cadastre anúncios para visualizar histórico e tendências.",
      filterLabel: "Filtro",
      filterHelp: "Escolha um item para focar os gráficos.",
      cards: {
        profit: "Lucro líquido",
        spread: "Margem de mercado",
        buyValue: "Custo de compra",
        sellValue: "Gold das vendas",
        fees: "Taxas do Market",
        units: "Unidades negociadas",
      },
      cardsHints: {
        profit: "Gold que sobra após todas as taxas do Market no encadeamento.",
        spread: "Diferença entre ask e bid; atalho para ver o lucro esperado por stack.",
        buyValue: "Gold gasto para comprar os stacks.",
        sellValue: "Gold recebido nas vendas.",
        fees: "Soma das taxas de compra e venda (incluindo herdadas).",
        units: "Quantidade de unidades negociadas no filtro atual.",
      },
    },
    tradesPanel: {
      eyebrow: "Anúncios",
      title: "Histórico",
      collapseTitle: "Recolher histórico",
      expandTitle: "Expandir histórico",
      loading: "Carregando log do Market...",
      empty: "Nenhum anúncio salvo ainda.",
      emptyFiltered: "Nenhum anúncio para o filtro selecionado.",
      filterLabel: "Filtro",
      filterHelp: "Filtra o histórico por item (alinhado com gráficos/totais).",
      actions: {
        undercut: "Relistar (undercut)",
        edit: "Editar anúncio",
        delete: "Apagar",
      },
      card: {
        bidAsk: "Compra / Venda",
        spread: "Margem de mercado",
        buyOrder: "Total comprado",
        sellOrder: "Total vendido",
        fees: "Taxas",
        inherited: "Herdadas",
        recorded: "Registrado em",
        realProfit: "Lucro líquido",
        unitFee: "{units} un | taxa {fee}",
      },
      cardHelp: {
        bidAsk: "Compra é o que você paga; venda é o que você anuncia no Market.",
        buyOrder: "Gold gasto para garantir o stack (já inclui taxa de compra).",
        sellOrder: "Gold recebido antes da taxa de venda.",
        fees: "Taxas do Market pagas e herdadas no encadeamento.",
        recorded: "Quando o anúncio foi salvo; a observação guarda contexto extra.",
        realProfit: "Gold que sobra após todas as taxas do Market no encadeamento.",
      },
    },
    tradeModal: {
      itemLabel: "Item",
      eyebrowNew: "Novo anúncio",
      eyebrowEdit: "Editar anúncio #{id}",
      defaultTitle: "Defina o item",
      registerItem: 'Cadastrar nome "{item}"',
      helper: "Use setas ou Tab para completar sugestões dos itens já salvos.",
      bid: "Preço de compra (bid)",
      ask: "Preço de venda (ask)",
      buyUnits: "Unidades compradas",
      sellUnits: "Unidades vendidas",
      undercut: "Anúncio pai (undercut)",
      noUndercut: "Sem undercut",
      undercutFeesLabel: "taxas herdadas:",
      undercutHelp:
        "Selecione um anúncio salvo para encadear um relist/undercut e carregar as taxas acumuladas.",
      duplicateLabel: "Duplicar anúncios (quantidade)",
      duplicateHelp:
        "Cria cópias independentes ao salvar o anúncio. Ignorado ao editar. Limite de {limit} cópias.",
      note: "Observação",
      notePlaceholder: "Ex: servidor, comprador, motivo do relist, etc",
      fieldHelp: {
        item: "Nomeie o item do Tibia como aparece no Market.",
        bid: "Gold pago por unidade para comprar o stack.",
        ask: "Gold esperado por unidade ao vender o stack.",
        buyUnits: "Quantidade de unidades que você realmente comprou.",
        sellUnits: "Quantidade que pretende vender (geralmente a mesma).",
        undercut: "Vincule a um anúncio pai para rastrear relists/undercuts e herdar taxas.",
        duplicate: "Crie várias cópias iguais de uma vez.",
        note: "Adicione contexto como servidor, comprador, hunt ou motivo do relist.",
      },
      summary: {
        spread: "Margem de mercado",
        profit: "Lucro bruto",
        realProfit: "Lucro líquido",
        hint: "Lucro líquido considera todas as taxas herdadas do encadeamento.",
        saveLoading: "Salvando...",
        saveEdit: "Salvar edição",
        saveNew: "Salvar anúncio",
        tooltips: {
          spread: "Ask menos bid antes das taxas.",
          profit: "Lucro bruto sem cortes do Market.",
          realProfit: "Lucro após taxas do Market e herdadas.",
        },
      },
      metrics: {
        spread: "Margem de mercado",
        spreadHint: "Diferença entre total de venda e de compra antes das taxas.",
        buyValue: "Total de compra",
        buyFeeHint: "{units} un | taxa de compra {fee}%",
        tradeValue: "Total de venda",
        sellFeeHint: "{units} un | taxa de venda {fee}%",
        totalFees: "Taxas do Market",
        totalFeesHint: "Inclui compra + venda (com herdadas).",
        profit: "Lucro bruto",
        profitHint: "Antes de qualquer taxa.",
        realProfit: "Lucro líquido",
        realProfitHint: "Após taxas do Market e herdadas.",
      },
    },
    tradeHelpers: {
      confirmDelete:
        "Remover anúncio #{id}? Os filhos vão perder o link de undercut.",
      parentPrimary: "Primária",
      parentUndercut: "Undercut de #{id} ({item})",
      parentMissing: "Undercut (referência não encontrada)",
    },
  },
};

export const defaultLocale: LocaleKey = "en";
