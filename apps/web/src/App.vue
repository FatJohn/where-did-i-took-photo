<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <RouterLink to="/" class="brand">
        <span class="brand-mark" aria-hidden="true">
          <span class="brand-dot" />
        </span>
        <span class="brand-text">
          <span class="brand-name">Wherewas</span>
          <span class="brand-sub">Field Notes Atlas</span>
        </span>
      </RouterLink>

      <nav class="nav" aria-label="Primary">
        <RouterLink to="/" class="nav-link">
          Find · 找
        </RouterLink>
        <RouterLink to="/history" class="nav-link">
          Field Log · 日誌
        </RouterLink>
      </nav>

      <div class="meta">
        <span>EST · 2026</span>
      </div>
    </header>

    <RouterView />

    <footer class="app-footer">
      <span class="eyebrow">Wherewas · Field Notes</span>
      <span>EXIF first · AI when needed · Honest when not</span>
    </footer>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1.5rem;
  width: min(1280px, calc(100% - 2.5rem));
  margin: 0 auto;
  padding: 1.25rem 0 1rem;
  border-bottom: 1px solid var(--edge);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  color: inherit;
  text-decoration: none;
}

.brand-mark {
  position: relative;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1.5px solid var(--ink);
}

.brand-dot {
  position: absolute;
  inset: 4px;
  border-radius: 50%;
  background: var(--amber);
}

.brand-text {
  display: grid;
  line-height: 1;
}

.brand-name {
  font-family: var(--serif);
  font-size: 1.15rem;
  letter-spacing: -0.02em;
}

.brand-sub {
  margin-top: 3px;
  font-family: var(--mono);
  font-size: 0.62rem;
  letter-spacing: 0.18em;
  color: var(--ink-2);
  text-transform: uppercase;
}

.nav {
  justify-self: center;
  display: flex;
  gap: 0.25rem;
}

.nav-link {
  padding: 0.5rem 0.95rem;
  border-radius: 999px;
  color: var(--ink);
  font-weight: 500;
  font-size: 0.92rem;
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
}

.nav-link:hover {
  background: rgba(184, 120, 43, 0.08);
}

.nav-link.router-link-exact-active {
  background: var(--ink);
  color: var(--paper);
}

.meta {
  font-family: var(--mono);
  font-size: 0.7rem;
  letter-spacing: 0.16em;
  color: var(--ink-2);
}

.app-footer {
  width: min(1280px, calc(100% - 2.5rem));
  margin: 2rem auto 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--edge);
  display: flex;
  justify-content: space-between;
  font-family: var(--mono);
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  color: var(--ink-2);
}

@media (max-width: 720px) {
  .app-header {
    grid-template-columns: 1fr auto;
    row-gap: 0.5rem;
  }
  .nav { grid-column: 1 / -1; justify-self: stretch; }
  .meta { display: none; }
}
</style>
