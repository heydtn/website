<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{
    close: null;
    minimize: null;
    maximize: null;
    unmaximize: null;
  }>();

  export let closable: boolean = true;
  export let minimizable: boolean = true;
  export let maximizable: boolean = true;
  export let unmaximizable: boolean = false;
</script>

<div class="manage">
  {#if closable}
    <button
      aria-label="Close Window"
      class="button close"
      on:click={() => dispatch('close')}
    />
  {/if}

  {#if minimizable}
    <button
      aria-label="Minimize Window"
      class="button minimize"
      on:click={() => dispatch('minimize')}
    />
  {/if}

  {#if maximizable}
    <button
      aria-label="Maximize Window"
      class="button maximize"
      on:click={() => dispatch('maximize')}
    />
  {/if}

  {#if unmaximizable}
    <button
      aria-label="Unmaximize Window"
      class="button unmaximize"
      on:click={() => dispatch('unmaximize')}
    />
  {/if}
</div>

<style lang="scss">
  @use 'sass:math';

  .manage {
    display: grid;
    grid-auto-columns: auto;
    grid-auto-flow: column;

    column-gap: math.div(3rem, 16);
  }

  .button {
    display: block;
    width: 1rem;
    height: 1rem;
    border: none;
    margin: 0;
    padding: 0;
    border-radius: 0;
    color: transparent;
    cursor: pointer;

    > * {
      pointer-events: none;
      user-select: none;
    }
  }

  .close {
    background-image: url(../images/window-close.png);
  }

  .minimize {
    background-image: url(../images/window-minimize.png);
  }

  .unmaximize {
    background-image: url(../images/window-unmaximize.png);
  }

  .maximize {
    background-image: url(../images/window-maximize.png);
  }
</style>
