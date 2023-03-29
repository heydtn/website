<script lang="ts">
  import ContextMenu, {
    type ContextMenuDefinition,
  } from './context_menu.svelte';
  import Cursor, { Cursors } from './cursor.svelte';
  import type { ContextMenuEvent } from './events';

  import { localUser, awareness, os } from './os';
  import type { Processes } from './processes';

  import BrowserComponent from './processes/browser.svelte';

  let users: any = [];

  let processes: Processes;

  let isFocusingWindow: boolean = false;

  // $: currentFocus = focusStack[focusStack.length - 1];

  let currentContextMenu: ContextMenuDefinition = [];
  let contextMenuVisible: boolean = false;
  let contextMenuX: number = 0;
  let contextMenuY: number = 0;

  // function focusWindow(index: number) {
  //   const toRemove = focusStack.indexOf(index);
  //   const newStack = focusStack.slice(0);
  //   newStack.splice(toRemove, 1);
  //   newStack.push(index);
  //   focusStack = newStack;
  //   isFocusingWindow = true;
  // }

  function clickedOutsideContext(event: MouseEvent) {
    contextMenuVisible = false;
    currentContextMenu = [];
  }

  function exitContext() {
    contextMenuVisible = false;
  }

  function clickedOutsideWindows(event: MouseEvent) {
    isFocusingWindow = false;
  }

  function clickedOutsideAll(event: MouseEvent) {
    clickedOutsideContext(event);
    clickedOutsideWindows(event);
  }

  function handleContext(event: CustomEvent<ContextMenuEvent>) {
    const { x, y, entries } = event.detail;
    currentContextMenu = entries;
    contextMenuX = x;
    contextMenuY = y;
    contextMenuVisible = true;
  }

  function updateCursorAwareness(event: MouseEvent) {
    awareness.setLocalStateField('mousePosition', {
      x: event.clientX,
      y: event.clientY,
    });
  }

  function updateCursorType(event: MouseEvent) {
    let type: Cursors;

    switch (event.buttons) {
      case 0:
        type = Cursors.Default;
        break;
      case 1:
        type = Cursors.Grab;
        break;
      case 2:
        type = Cursors.Grab;
        break;
      default:
        type = Cursors.Default;
        break;
    }

    awareness.setLocalStateField('mouseType', type);
  }

  function stopMouseAwareness(event: MouseEvent) {
    awareness.setLocalStateField('mousePosition', null);
  }

  function withCursorUpdate(f: (event: MouseEvent) => void) {
    return (event: MouseEvent) => {
      updateCursorType(event);
      f(event);
    };
  }

  const windowBarExample = [
    {
      label: 'File',
      shortcut: 'f',
      entries: [[{ label: 'Open' }], [{ label: 'Close' }]],
    },
    { label: 'Window', shortcut: 'w', entries: [] },
  ];

  awareness.on('change', () => {
    users = Array.from(awareness.getStates().values());
  });

  os.processes.subscribe((ps) => {
    processes = ps;
  });
</script>

<svelte:window
  on:mouseup={updateCursorType}
  on:mousemove={updateCursorAwareness}
  on:mouseout={stopMouseAwareness}
/>

<div
  class="layers"
  on:contextmenu|preventDefault
  on:mousedown={withCursorUpdate(clickedOutsideAll)}
>
  <div class="layer-background" />

  <!-- For the window layer, we want to capture left clicks to exit the context menu,
       but prevent bubbling of the click event so we don't unfocus stuff -->
  <div
    class="layer-windows"
    on:mousedown|stopPropagation={withCursorUpdate(clickedOutsideContext)}
  >
    {#each [...processes] as [_, process]}
      <svelte:component this={process.component} {process} />
    {/each}
  </div>

  {#if contextMenuVisible}
    <div
      class="layer-overlay"
      on:mousedown={withCursorUpdate(clickedOutsideContext)}
    >
      <ContextMenu
        x={contextMenuX}
        y={contextMenuY}
        entries={currentContextMenu}
        on:exit={exitContext}
      />
    </div>
  {/if}

  <div class="layer-mouse">
    {#each users as user}
      {#if user.mousePosition && user.name !== localUser}
        <Cursor
          type={user.mouseType}
          x={user.mousePosition.x}
          y={user.mousePosition.y}
          name={user.name}
        />
      {/if}
    {/each}
  </div>
</div>

<style lang="scss">
  @use 'sass:math';

  :root {
    --color-background-50: white;
    --color-background-500: #cecfce;
    --color-background-600: #848084;
    --color-background-900: black;

    --color-on-context-menu-active: white;
    --color-context-menu-active: #2900ad;

    --color-on-menu-bar-active: white;
    --color-menu-bar-active: #2900ad;

    --color-on-window-bar-active: white;
    --color-window-bar-active: #2900ad;
    --color-on-window-bar-inactive: #dddcdd;
    --color-window-bar-inactive: #818081;

    --frame-border-size: #{math.div(1rem, 16)};
    --taskbar-height: 2rem;
  }

  .layer-background {
    display: block;
    position: absolute;
    z-index: 0;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url('../images/wallpapers/bluerivets.bmp');
    background-repeat: repeat;
  }

  .layer-windows {
    display: block;
    position: absolute;
    z-index: 1;
    top: 0;
    left: 0;
    min-height: fit-content;
  }

  .layer-overlay {
    display: block;
    position: absolute;
    z-index: 2;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  .layer-mouse {
    display: block;
    position: absolute;
    z-index: 3;
    top: 0;
    left: 0;
  }
</style>
