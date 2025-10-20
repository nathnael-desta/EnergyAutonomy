<template>
  <!-- Stack vertically on small screens, row on lg+. Main content gets left margin on lg to account for fixed sidebar. -->
  <div class="flex flex-col lg:flex-row min-h-screen">

    <!-- Mobile: toggleable sidebar (modal + backdrop) -->
    <div :class="mobileSidebarOpen ? 'fixed inset-0 z-40' : 'hidden lg:block'">
      <template v-if="mobileSidebarOpen">
        <div class="fixed inset-0 bg-black/50" @click="mobileSidebarOpen = false"></div>
        <div class="fixed left-0 top-0 bottom-0 w-64 z-50 bg-white overflow-auto">
          <the-sidebar @close="mobileSidebarOpen = false" />
        </div>
      </template>

      <!-- Desktop: always visible -->
      <div class="hidden lg:block">
        <the-sidebar />
      </div>
    </div>

    <div class="flex flex-col flex-grow bg-gray-200 ">
      <!-- Mobile toggle button -->
      <button
        class="lg:hidden absolute left-4 top-4 z-50 inline-flex items-center rounded-md bg-white p-2 text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        @click="mobileSidebarOpen = !mobileSidebarOpen"
        aria-label="Toggle sidebar"
      >
        <!-- hamburger icon -->
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/>
        </svg>
      </button>

      <the-header />

      <!-- Main content: make it fluid on large screens so it stretches instead of staying constrained -->
      <main class="mb-auto w-full">
        <!-- inner wrapper controls padding but allows full-width growth on large screens -->
        <div class="w-full max-w-full px-4 sm:px-6 lg:px-8">
          <router-view />
        </div>
      </main>

    </div>
  </div>
</template>

<script>
import TheSidebar from '@/components/layouts/TheSidebar.vue'
import TheHeader from '@/components/layouts/TheHeader.vue'
import TheFooter from '@/components/layouts/TheFooter.vue'

export default {
  components: {
    TheSidebar,
    TheHeader,
    TheFooter,
  },
  data() {
    return {
      mobileSidebarOpen: false,
    }
  },
}
</script>
