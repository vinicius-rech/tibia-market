import { computed, onMounted } from "vue";
import {
  defaultLocale,
  messages,
  type LocaleKey,
} from "~/i18n/messages";

const STORAGE_KEY = "tibia-trader-locale";

function readStoredLocale(): LocaleKey {
  if (typeof window === "undefined") {
    return defaultLocale;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  return (stored as LocaleKey) && stored in messages
    ? (stored as LocaleKey)
    : defaultLocale;
}

export function useI18n() {
  const locale = useState<LocaleKey>("locale", () => readStoredLocale());

  const currentMessages = computed(
    () => messages[locale.value] ?? messages[defaultLocale],
  );

  onMounted(() => {
    const stored = readStoredLocale();
    if (stored !== locale.value) {
      locale.value = stored;
    }
  });

  const localeOptions = computed(() =>
    Object.entries(messages).map(([code, data]) => ({
      code: code as LocaleKey,
      label: data.meta.nativeName,
      flag: data.meta.flag,
    })),
  );

  const setLocale = (value: LocaleKey) => {
    locale.value = value;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, value);
    }
  };

  const t = (path: string, params?: Record<string, string | number>) => {
    const value = path
      .split(".")
      .reduce(
        (acc: unknown, key) =>
          typeof acc === "object" && acc !== null ? (acc as any)[key] : undefined,
        currentMessages.value,
      );

    if (typeof value !== "string") {
      return path;
    }

    if (!params) {
      return value;
    }

    return value.replace(/\{(\w+)\}/g, (_, key) =>
      params[key] !== undefined ? String(params[key]) : `{${key}}`,
    );
  };

  return {
    locale,
    setLocale,
    t,
    localeOptions,
    messages: currentMessages,
  };
}
