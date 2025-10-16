<template>
  <!-- Sidebar: relative on small screens (pushes content down), fixed on lg+ -->
  <aside class="relative lg:fixed lg:inset-y-0 lg:left-0 z-40 lg:w-64 w-full border-gray-200 bg-white
                 border-b lg:border-b-0 lg:border-r overflow-auto lg:overflow-hidden">
    <!-- Brand -->
    <div class="flex items-center gap-2 px-4 py-4">
      <RouterLink to="/" class="flex items-center gap-2">
        <div class="flex h-8 w-8 items-center justify-center rounded-md bg-gray-900 text-white">
          <!-- simple bolt icon -->
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/>
          </svg>
        </div>
        <span class="text-base font-semibold tracking-tight">Energy Autonomy</span>
      </RouterLink>
    </div>

    <!-- Nav -->
    <nav class="mt-2 px-2 pb-6">
      <RouterLink
        to="/"
        class="mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900"
        active-class="bg-gray-900 text-white hover:bg-gray-900"
      >
        <!-- home icon -->
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 opacity-80" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3 2 12h3v9h6v-6h2v6h6v-9h3z"/>
        </svg>
        <span>Dashboard</span>
      </RouterLink>
    </nav>
  </aside>
</template>

<script setup>
import { RouterLink } from 'vue-router'
</script>