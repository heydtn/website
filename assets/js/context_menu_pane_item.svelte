<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let label: string;
  export let shortcut: undefined | null | string;

  const dispatch = createEventDispatcher();

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
</script>

<button class="text">
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
    display: flex;
    width: 100%; // Needed because button doesn't behave like normal block elements
    border: none;
    background-color: transparent;
    font-family: inherit;
    font-weight: inherit;
    font-size: inherit;
    line-height: inherit;
    text-align: left;
    padding: math.div(2rem, 16) math.div(8rem, 16);

    &:focus,
    &:hover {
      outline: none;
      color: var(--color-on-context-menu-active);
      background-color: var(--color-context-menu-active);
    }
  }

  .underline {
    text-decoration: underline;
    text-underline-offset: 0.1rem;
    text-decoration-thickness: 0.1rem;
  }
</style>
