<script setup lang="ts">
import { computed } from "vue";
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
</script>

<template>
  <header class="hero">
    <div class="hero__left">
      <p class="eyebrow">
        <img class="logo-mark" src="/logo.png" alt="TMD" />
        Tibia Artisan Studio
      </p>
    </div>
    <div class="hero__actions">
      <div class="hero__filter">
        <select id="globalFilter" v-model="globalFilter">
          <option value="">Todos os itens</option>
          <option v-for="item in items" :key="item" :value="item">
            {{ item }}
          </option>
        </select>
      </div>
      <button class="primary" type="button" @click="emit('new-trade')">
        Nova ordem
      </button>
      <button class="ghost" type="button" @click="emit('open-fee')">
        Taxas
      </button>
      <button class="ghost" type="button" @click="emit('open-backup')">
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
</template>
