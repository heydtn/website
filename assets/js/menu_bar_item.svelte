<script lang="ts">
  import type { ContextMenuEvent } from './events.js';
  import type { ContextMenuDefinition } from './context_menu.svelte';

  import { createEventDispatcher } from 'svelte';

  export let label: string;
  export let shortcut: undefined | null | string;
  export let entries: ContextMenuDefinition;

  let button: HTMLElement;

  const dispatch = createEventDispatcher<{ context: ContextMenuEvent }>();

  $: contents = computeContents(label, shortcut);

  function computeContents(label: string, shortcut: undefined | null | string) {
    if (shortcut && isValidShortcut(shortcut)) {
      const pattern = new RegExp(shortcut, 'i');
      const index = label.search(pattern);

      if (index > -1) {
        return {
          start: label.substring(0, index),
          underline: label.at(index),
          end: label.substring(index + 1),
        };
      }
    }

    return null;
  }

  function isValidShortcut(shortcut: string): boolean {
    return shortcut.length === 1 && !!shortcut.match(/[a-z0-9]/i);
  }

  function handleMouseDown(event: MouseEvent) {
    const bounds = button.getBoundingClientRect();
    dispatch('context', {
      x: bounds.left - 7,
      y: bounds.bottom,
      entries: entries,
    });
  }
</script>

<button
  class="text"
  bind:this={button}
  on:mousedown|stopPropagation={handleMouseDown}
>
  {#if contents}
    <span>{contents.start}</span>
    <span class="underline">{contents.underline}</span>
    <span>{contents.end}</span>
  {:else}
    {label}
  {/if}
</button>

<style lang="scss">
  @use 'sass:math';

  .text {
    white-space: normal;
    appearance: none;
    display: inline-flex;
    border: none;
    background-color: transparent;
    font-family: inherit;
    font-weight: inherit;
    font-size: inherit;
    line-height: inherit;
    text-align: left;
    padding: math.div(2rem, 16) math.div(4rem, 16);
    margin-left: math.div(4rem, 16);

    &:focus,
    &:hover {
      outline: none;
      color: var(--color-on-menu-bar-active);
      background-color: var(--color-menu-bar-active);
    }
  }

  .underline {
    text-decoration: underline;
    text-underline-offset: math.div(1.6rem, 16);
    text-decoration-thickness: math.div(1.6rem, 16);
  }
</style>
