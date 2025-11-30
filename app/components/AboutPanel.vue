<script setup lang="ts">
import { computed } from "vue";
const props = defineProps<{
  showAbout: boolean;
}>();

const emit = defineEmits<{
  (event: "update:showAbout", value: boolean): void;
}>();

const open = computed({
  get: () => props.showAbout,
  set: (value: boolean) => emit("update:showAbout", value),
});
</script>

<template>
  <section class="panel about">
    <div class="panel__header">
      <div class="panel__header__title">
        <p class="eyebrow">Sobre</p>
        <div class="panel__title-row">
          <h2>Como a ferramenta funciona</h2>
          <button
            class="panel__toggle"
            type="button"
            :aria-pressed="open"
            :title="open ? 'Recolher sessao de sobre' : 'Expandir sessao de sobre'"
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
            <span>{{ open ? "Esconder" : "Mostrar" }}</span>
          </button>
        </div>
      </div>
    </div>
    <div v-if="open" class="panel__body about__content">
      <article class="about__block">
        <p class="about__label">O que e</p>
        <h3>Tibia Artisan Studio</h3>
        <p>
          Dashboard local para simular, salvar e acompanhar trades do mercado do Tibia com calculo de fees,
          spread e encadeamento de undercuts.
        </p>
      </article>
      <article class="about__block">
        <p class="about__label">Como usar</p>
        <h3>Passo a passo rapido</h3>
        <ul class="about__list">
          <li>Escolha um item (ou cadastre um nome novo) e preencha bid/ask e unidades.</li>
          <li>
            Ajuste as taxas globais ou por ordem; o resumo de metricas calcula spread, fees e real profit antes de salvar.
          </li>
          <li>Grave a ordem. Use "Criar undercut" em qualquer trade para herdar fees e manter o historico ligado.</li>
          <li>Filtre por item nos paineis de totais, graficos e historico para comparar desempenhos.</li>
          <li>Use o backup para exportar/importar os dados locais ou limpar tudo quando quiser recomeçar.</li>
        </ul>
      </article>
    </div>
  </section>
</template>
