<script context="module" lang="ts">
  import type { ContextMenuDefinition } from './context_menu.svelte';

  export interface MenuBarEntry {
    shortcut?: string;
    label: string;
    entries: ContextMenuDefinition;
  }

  export type MenuBarDefinition = MenuBarEntry[];
</script>

<script lang="ts">
  import MenuBarItem from './menu_bar_item.svelte';

  export let entries: MenuBarDefinition;
</script>

<div class="menu-bar">
  {#each entries as entry, index}
    <MenuBarItem
      label={entry.label}
      shortcut={entry.shortcut}
      entries={entry.entries}
      on:context
    />
  {/each}
</div>

<style lang="scss">
  @use 'sass:math';

  .menu-bar {
    user-select: none;
    font-size: math.div(12rem, 16);
    font-weight: bold;
    display: flex;
    flex-direction: row;
    position: relative;
    background-color: var(--color-background-500);
  }
</style>
