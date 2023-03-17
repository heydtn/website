<script context="module" lang="ts">
  export interface ContextMenuEntry {
    shortcut?: string;
    label: string;
    handler?: () => void;
    entries?: ContextMenuDefinition;
  }

  export type ContextMenuGroup = ContextMenuEntry[];

  export type ContextMenuDefinition = ContextMenuGroup[];
</script>

<script lang="ts">
  import ContextMenuPaneItem from './context_menu_pane_item.svelte';
  import { createEventDispatcher, onMount } from 'svelte';

  const dispatch = createEventDispatcher();

  export let entries: ContextMenuDefinition;

  let contextMenu: HTMLDivElement;
  let currentEntry: null | ContextMenuEntry;

  const providedActions: { [index: string]: () => void } = {};
  entries.forEach((group) =>
    group.forEach((entry) => {
      if (entry.shortcut && entry.handler) {
        providedActions[entry.shortcut] = entry.handler;
      }
    })
  );

  interface KeyActions {
    readonly [index: string]: () => void;
  }

  const keyActions: KeyActions = {
    ...providedActions,
    Escape: exit,
  };

  function handleKeyup(event: KeyboardEvent): void {
    if (!currentEntry?.entries) {
      const keyAction = keyActions[event.key];
      if (keyAction) {
        exit();
        keyAction();
      }
    }
  }

  function buildMouseUpHandler(handler: undefined | (() => void)): () => void {
    if (handler) {
      return () => {
        exit();
        handler();
      };
    } else {
      return () => {};
    }
  }

  function exit() {
    dispatch('exit');
  }

  onMount(() => {
    contextMenu.focus();
  });
</script>

<svelte:window on:keydown={handleKeyup} />

<div
  class="pane"
  bind:this={contextMenu}
  on:mousedown|stopPropagation
  on:mouseup|stopPropagation
>
  {#each entries as group}
    <div class="group">
      {#each group as entry}
        <div
          class="entry"
          on:mouseenter={() => (currentEntry = entry)}
          on:mouseup|stopPropagation={buildMouseUpHandler(entry.handler)}
        >
          {#if entry.entries}
            <ContextMenuPaneItem
              label={entry.label}
              shortcut={entry.shortcut}
            />

            {#if currentEntry === entry}
              <div class="submenu">
                <svelte:self entries={entry.entries} on:exit />
              </div>
            {/if}
          {:else}
            <ContextMenuPaneItem
              label={entry.label}
              shortcut={entry.shortcut}
            />
          {/if}
        </div>
      {/each}
    </div>
  {/each}
</div>

<style lang="scss">
  @use 'sass:math';

  .entry {
    position: relative;
  }

  .submenu {
    position: absolute;
    left: 100%;
    top: calc(var(--frame-border-size) * -2);
  }

  .pane {
    min-width: 8rem;
    user-select: none;
    font-size: math.div(12rem, 16);
    font-weight: bold;
    display: flex;
    flex-direction: column;
    position: relative;
    background-color: var(--color-background-500);

    border-top: var(--frame-border-size) solid var(--color-background-600);
    border-left: var(--frame-border-size) solid var(--color-background-600);
    border-bottom: var(--frame-border-size) solid var(--color-background-900);
    border-right: var(--frame-border-size) solid var(--color-background-900);
  }

  .group {
    border-top: var(--frame-border-size) solid var(--color-background-50);
    border-left: var(--frame-border-size) solid var(--color-background-50);
    border-bottom: var(--frame-border-size) solid var(--color-background-600);
    border-right: var(--frame-border-size) solid var(--color-background-600);

    &:not(:last-child) {
      border-bottom: 1px solid var(--color-background-600);
    }
  }
</style>
