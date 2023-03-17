<script context="module" lang="ts">
  import type {
    ContextMenuEntry,
    ContextMenuGroup,
    ContextMenuDefinition,
  } from './context_menu_pane.svelte';

  export type { ContextMenuEntry, ContextMenuGroup, ContextMenuDefinition };
</script>

<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import ContextMenuPane from './context_menu_pane.svelte';

  const dispatch = createEventDispatcher();

  export let x: number = 0;
  export let y: number = 0;
  export let entries: ContextMenuDefinition;

  let contextMenu: HTMLDivElement;

  onMount(() => {
    contextMenu.focus();
  });
</script>

<div
  class="context"
  style:left="{x}px"
  style:top="{y}px"
  bind:this={contextMenu}
  on:mousedown|stopPropagation
>
  <ContextMenuPane {entries} on:exit />
</div>

<style lang="scss">
  .context {
    user-select: none;
    display: flex;
    position: absolute;
  }
</style>
