import { reactive } from "vue";
import {
  START_LOCATION,
  routeLocationKey,
  type RouteLocationNormalizedLoaded,
} from "vue-router";

/**
 * Nuxt disables the router when there is no `pages/` directory.
 * Vercel Analytics still calls `useRoute`, so we provide a minimal
 * route location to silence the missing injection warning.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const provides = nuxtApp.vueApp._context.provides;
  if (provides[routeLocationKey as symbol]) return;

  const location = reactive<RouteLocationNormalizedLoaded>({
    ...START_LOCATION,
    path: START_LOCATION.path || "/",
    fullPath: START_LOCATION.fullPath || START_LOCATION.path || "/",
  });

  nuxtApp.vueApp.provide(routeLocationKey, location);
});
