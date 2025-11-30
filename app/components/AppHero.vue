<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "~/composables/useI18n";

const props = defineProps<{
  items: string[];
  globalItemFilter: string;
}>();

const emit = defineEmits<{
  (event: "update:globalItemFilter", value: string): void;
  (event: "new-trade"): void;
  (event: "open-fee"): void;
  (event: "open-backup"): void;
}>();

const globalFilter = computed({
  get: () => props.globalItemFilter,
  set: (value: string) => emit("update:globalItemFilter", value),
});

const { t, locale, setLocale, localeOptions, messages } = useI18n();

const selectedLocale = computed({
  get: () => locale.value,
  set: (value: string) => setLocale(value as any),
});

const activeLocale = computed(() =>
  localeOptions.value.find((entry) => entry.code === locale.value) ??
  localeOptions.value[0],
);
</script>

<template>
  <header class="hero">
    <div class="header__container">
      <div class="hero__left">
        <p class="eyebrow">
          <img class="logo-mark" src="/logo.png" alt="TMD" />
          {{ messages.common.appName }}
        </p>
      </div>
      <div class="hero__actions">
        <div class="hero__filter">
          <select id="globalFilter" v-model="globalFilter">
            <option value="">{{ messages.common.allItems }}</option>
            <option v-for="item in items" :key="item" :value="item">
              {{ item }}
            </option>
          </select>
        </div>
        <button class="primary" type="button" @click="emit('new-trade')">
          {{ t("hero.newTrade") }}
        </button>
        <button class="ghost" type="button" @click="emit('open-fee')">
          {{ t("hero.fees") }}
        </button>
        <button class="ghost" type="button" @click="emit('open-backup')">
          {{ t("hero.backup") }}
        </button>
        <div class="hero__lang">
          <div class="hero__lang-select-wrap">
            <select v-model="selectedLocale" class="hero__lang-select">
              <option
                  v-for="option in localeOptions"
                  :key="option.code"
                  :value="option.code"
              >
                {{ option.flag }} {{ option.label }}
              </option>
            </select>
          </div>
        </div>
        <a
            class="hero__github"
            href="https://github.com/vinicius-rech/tibia-market"
            target="_blank"
            rel="noopener noreferrer"
        >
          <UIcon name="i-simple-icons-github" class="hero__github-icon" />
        </a>
      </div>
    </div>
  </header>
</template>
