# Tibia Market Desk

Aplicação Nuxt 4 para registrar ordens de compra/venda e undercuts no Tibia, com métricas, gráficos rápidos e backup/restauração local via PGlite.

## Principais recursos
- Registro de trades com taxas, spread, profit e real profit calculados automaticamente.
- Sugestões/autocomplete de itens, filtros globais e edição/duplicação de operações.
- Gráficos de tendência e painéis de totais para acompanhar performance.
- Exportação/importação de backup em JSON e reset de dados (persistência local PGlite).
- Vercel Analytics conectado para telemetria em produção.

## Requisitos
- Node.js 18+ e npm.

## Instalação
```bash
npm install
```

## Scripts úteis
- `npm run dev` – inicia o servidor de desenvolvimento em `http://localhost:3000`.
- `npm run build` – cria o bundle de produção.
- `npm run preview` – serve o bundle gerado para inspeção local.
- `npm run generate` – gera build estático (quando aplicável).
- `npm run postinstall` (automático) – executa `nuxt prepare` para sincronizar tipos.

## Desenvolvimento
1) Execute `npm run dev` e acesse `http://localhost:3000`.
2) Dados ficam salvos localmente via PGlite; use a seção de backup para exportar/importar JSON.

## Qualidade
- Rode `npx eslint .` antes de enviar mudanças.

## Deploy
- Crie o build com `npm run build` e faça o deploy do conteúdo de `.output/` na sua plataforma.

## Licença
- Este projeto está licenciado sob os termos da licença MIT (veja `LICENSE`).
