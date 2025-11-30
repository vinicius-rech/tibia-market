<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "~/composables/useI18n";

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

const { messages } = useI18n();
</script>

<template>
  <section class="panel about">
    <div class="panel__header">
      <div class="panel__header__title">
        <p class="eyebrow">{{ messages.about.eyebrow }}</p>
        <div class="panel__title-row">
          <h2>{{ messages.about.title }}</h2>
          <button
            class="panel__toggle"
            type="button"
            :aria-pressed="open"
            :title="open ? messages.common.collapse : messages.common.expand"
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
    </div>
    <div v-if="open" class="panel__body about__content">
      <article class="about__block">
        <p class="about__label">{{ messages.about.whatLabel }}</p>
        <h3>{{ messages.common.appName }}</h3>
        <p>{{ messages.about.description }}</p>
      </article>
      <article class="about__block">
        <p class="about__label">{{ messages.about.howLabel }}</p>
        <h3>{{ messages.about.quickstart }}</h3>
        <ul class="about__list">
          <li v-for="(step, index) in messages.about.steps" :key="index">
            {{ step }}
          </li>
        </ul>
      </article>
      <article class="about__block about__disclaimer">
        <p class="about__label">{{ messages.about.disclaimerTitle }}</p>
        <p>{{ messages.about.disclaimerBody }}</p>
      </article>
    </div>
  </section>
</template>
