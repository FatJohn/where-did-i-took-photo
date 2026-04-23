<template>
  <div class="app-shell">
    <header class="app-header">
      <RouterLink
        class="brand"
        to="/"
      >
        照片定位工具
      </RouterLink>

      <nav class="nav">
        <RouterLink
          class="nav-link"
          to="/"
        >
          首頁
        </RouterLink>
        <RouterLink
          class="nav-link"
          to="/history"
        >
          歷史
        </RouterLink>
      </nav>
    </header>

    <RouterView />
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  background:
    radial-gradient(circle at top, rgba(218, 165, 32, 0.18), transparent 28%),
    linear-gradient(180deg, #f7f1e3 0%, #f5f5f4 42%, #ffffff 100%);
  color: #1f2937;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: min(960px, calc(100% - 2rem));
  margin: 0 auto;
  padding: 1.5rem 0 1rem;
}

.brand {
  color: inherit;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-decoration: none;
}

.nav {
  display: flex;
  gap: 0.75rem;
}

.nav-link {
  padding: 0.5rem 0.85rem;
  border-radius: 999px;
  color: #374151;
  text-decoration: none;
}

.nav-link.router-link-exact-active {
  background: rgba(146, 64, 14, 0.1);
  color: #92400e;
}
</style>
