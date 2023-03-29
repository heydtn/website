<script lang="ts" context="module">
  export interface WindowEvent {
    x: number;
    y: number;
    width: number;
    height: number;
    minimized: boolean;
    maximized: boolean;
  }
</script>

<script lang="ts">
  import { createEventDispatcher, tick } from 'svelte';
  import WindowManage from './window_manage.svelte';
  import type {
    ContextMenuDefinition,
    ContextMenuGroup,
  } from './context_menu.svelte';
  import type { ContextMenuEvent } from './events';

  import type { Window as WindowData, WindowArgs } from './windows';

  const dispatch = createEventDispatcher<{
    context: ContextMenuEvent;
    focus: void;
    close: void;
  }>();

  export let window: WindowData;

  export let debug: boolean = false;
  export let title: string = '';

  let render: boolean = false;
  let x: number = 50;
  let y: number = 50;
  let z: number = 0;
  let width: number = 400;
  let height: number = 500;
  let minimized: boolean = false;
  let maximized: boolean = false;

  export let minWidth: number = 162;
  export let minHeight: number = 40;
  export let resizable: boolean = true;
  export let closable: boolean = true;
  export let minimizable: boolean = true;
  export let maximizable: boolean = true;

  export let focused: boolean = false;

  export let contextMenuEntries: ContextMenuDefinition = [];

  $: showManage = closable || minimizable || maximizable;

  $: minWidthActual = Math.max(minWidth, 162);
  $: minHeightActual = Math.max(minHeight, 40);

  let moveOffsetX: number = 0;
  let moveOffsetY: number = 0;

  let dragHandler: null | ((event: MouseEvent) => void) = null;

  $: {
    const elements: ContextMenuDefinition = [];

    elements.push([
      { shortcut: 'i', label: 'Pickup', handler: moveWithoutClick },
    ]);

    const windowControlElements: ContextMenuGroup = [];

    if (maximizable) {
      if (maximized) {
        windowControlElements.push({
          shortcut: 'm',
          label: 'Unmaximize',
          handler: handleUnmaximize,
        });
      } else {
        windowControlElements.push({
          shortcut: 'm',
          label: 'Maximize',
          handler: handleMaximize,
        });
      }
    }

    if (minimizable) {
      windowControlElements.push({
        shortcut: 'i',
        label: 'Minimize',
        handler: handleMinimize,
      });
    }

    if (resizable) {
      windowControlElements.push({
        shortcut: 'r',
        label: 'Resize',
        handler: resizeClick(dragSizeSE),
      });
    }

    if (windowControlElements.length > 0) {
      elements.push([{ label: 'Window', entries: [windowControlElements] }]);
    }

    if (closable) {
      elements.push([{ label: 'Close', handler: handleClose }]);
    }

    contextMenuEntries = elements;
  }

  function leftClick(handler: (event: MouseEvent) => void) {
    return (event: MouseEvent) => {
      if (event.button == 0) {
        dispatch('focus');
        handler(event);
      }
    };
  }

  function resizeClick(handler: (event: MouseEvent) => void) {
    return () => {
      if (!maximized) {
        dragHandler = handler;
      }
    };
  }

  function moveClick(event: MouseEvent) {
    if (!maximized) {
      moveOffsetX = x - event.clientX;
      moveOffsetY = y - event.clientY;
      dragHandler = dragMove;
    }
  }

  function moveWithoutClick() {
    if (!maximized) {
      dragHandler = moveClick;
    }
  }

  function dragStop() {
    dragHandler = null;
  }

  function calcN(event: MouseEvent) {
    let otherSide = y + height;
    y = Math.min(event.clientY, otherSide - minHeight);
    height = otherSide - y;
  }

  function calcE(event: MouseEvent) {
    width = Math.max(minWidthActual, event.clientX - x);
  }

  function calcS(event: MouseEvent) {
    height = Math.max(minHeightActual, event.clientY - y);
  }

  function calcW(event: MouseEvent) {
    let otherSide = x + width;
    x = Math.min(event.clientX, otherSide - minWidth);
    width = otherSide - x;
  }

  function dragSizeN(event: MouseEvent) {
    calcN(event);
    window.update({ y, height });
  }
  function dragSizeE(event: MouseEvent) {
    calcE(event);
    window.update({ width });
  }
  function dragSizeS(event: MouseEvent) {
    calcS(event);
    window.update({ height });
  }
  function dragSizeW(event: MouseEvent) {
    calcW(event);
    window.update({ x, width });
  }
  function dragSizeNE(event: MouseEvent) {
    calcN(event);
    calcE(event);
    window.update({ y, height, width });
  }
  function dragSizeNW(event: MouseEvent) {
    calcN(event);
    calcW(event);
    window.update({ x, y, height, width });
  }
  function dragSizeSE(event: MouseEvent) {
    calcS(event);
    calcE(event);
    window.update({ height, width });
  }
  function dragSizeSW(event: MouseEvent) {
    calcS(event);
    calcW(event);
    window.update({ x, height, width });
  }

  function dragMove(event: MouseEvent) {
    x = moveOffsetX + event.clientX;
    y = moveOffsetY + event.clientY;
    window.update({ x, y });
  }

  function toggleMaximized() {
    if (maximizable) {
      maximized = !maximized;
      window.update({ maximized });
    }
  }

  function handleMinimize() {
    minimized = true;
    window.update({ minimized });
  }

  function handleMaximize() {
    maximized = true;
    window.update({ maximized });
  }

  function handleUnmaximize() {
    maximized = false;
    window.update({ maximized });
  }

  function handleContextMenu(event: MouseEvent) {
    dispatch('context', {
      x: event.clientX,
      y: event.clientY,
      entries: contextMenuEntries,
    });
  }

  function handleMouseDown(event: MouseEvent) {
    if (event.button != 2) {
      dispatch('focus');
    }
  }

  function handleClose() {
    dispatch('close');
  }

  $: window.subscribe(
    ({
      x: ix,
      y: iy,
      z: iz,
      width: iwidth,
      height: iheight,
      minimized: iminimized,
      maximized: imaximized,
    }) => {
      if (ix !== undefined) {
        x = ix;
      }
      if (iy !== undefined) {
        y = iy;
      }
      if (iz !== undefined) {
        z = iz;
      }
      if (iwidth !== undefined) {
        width = iwidth;
      }
      if (iheight !== undefined) {
        height = iheight;
      }
      if (iminimized !== undefined) {
        minimized = iminimized;
      }
      if (imaximized !== undefined) {
        maximized = imaximized;
      }
      render = true;
    }
  );
</script>

<svelte:window on:mousemove={dragHandler} on:mouseup={dragStop} />

{#if render}
  <div
    class="window"
    class:debug
    class:focused
    class:maximized
    style:left="{x}px"
    style:top="{y}px"
    style:z-index={z}
    style:width="{width}px"
    style:height="{height}px"
    on:mousedown={handleMouseDown}
    on:contextmenu={handleContextMenu}
  >
    <div class="inner">
      <div class="actions">
        <slot name="actions" />
      </div>

      {#if showManage}
        <div class="manage">
          <WindowManage
            {closable}
            {minimizable}
            maximizable={maximizable && !maximized}
            unmaximizable={maximizable && maximized}
            on:close={handleClose}
            on:minimize={handleMinimize}
            on:maximize={handleMaximize}
            on:unmaximize={handleUnmaximize}
          />
        </div>
      {/if}

      <div
        class="handle"
        on:dblclick={toggleMaximized}
        on:mousedown={leftClick(moveClick)}
      >
        <span class="handle-contents">{title}</span>
        <div class="handle-bottom" />
      </div>

      <div class="body">
        <slot />
      </div>

      <div class="footer">
        <slot name="footer" />
      </div>
    </div>

    {#if resizable && !maximized}
      <div
        class="resize edge n"
        on:mousedown={leftClick(resizeClick(dragSizeN))}
        on:mouseup={dragStop}
      />
      <div
        class="resize edge e"
        on:mousedown={leftClick(resizeClick(dragSizeE))}
        on:mouseup={dragStop}
      />
      <div
        class="resize edge s"
        on:mousedown={leftClick(resizeClick(dragSizeS))}
        on:mouseup={dragStop}
      />
      <div
        class="resize edge w"
        on:mousedown={leftClick(resizeClick(dragSizeW))}
        on:mouseup={dragStop}
      />
      <div
        class="resize corner nw"
        on:mousedown={leftClick(resizeClick(dragSizeNW))}
        on:mouseup={dragStop}
      />
      <div
        class="resize corner sw"
        on:mousedown={leftClick(resizeClick(dragSizeSW))}
        on:mouseup={dragStop}
      />
      <div
        class="resize corner ne"
        on:mousedown={leftClick(resizeClick(dragSizeNE))}
        on:mouseup={dragStop}
      />
      <div
        class="resize corner se"
        on:mousedown={leftClick(resizeClick(dragSizeSE))}
        on:mouseup={dragStop}
      />
    {/if}
  </div>
{/if}

<style lang="scss">
  @use 'sass:math';

  .window {
    position: absolute;
    background: var(--color-background-500);

    border-top: var(--frame-border-size) solid var(--color-background-600);
    border-left: var(--frame-border-size) solid var(--color-background-600);
    border-bottom: var(--frame-border-size) solid var(--color-background-900);
    border-right: var(--frame-border-size) solid var(--color-background-900);
  }

  .resize {
    position: absolute;
    user-select: none;
  }

  .debug > .resize.corner {
    background-color: red;

    &::after {
      background-color: red;
    }
  }

  .debug > .resize.edge {
    background-color: blue;
  }

  $handle-size: math.div(8rem, 16);
  $handle-margin: math.div(-6rem, 16);
  $corner-size: math.div(10rem, 16);

  .resize.edge.e {
    cursor: e-resize;
    width: $handle-size;
    height: 100%;
    right: $handle-margin;
    top: 0;
  }

  .resize.edge.w {
    cursor: w-resize;
    width: $handle-size;
    height: 100%;
    left: $handle-margin;
    top: 0;
  }

  .resize.edge.n {
    cursor: n-resize;
    width: 100%;
    height: $handle-size;
    left: 0;
    top: $handle-margin;
  }

  .resize.edge.s {
    cursor: s-resize;
    width: 100%;
    height: $handle-size;
    left: 0;
    bottom: $handle-margin;
  }

  .resize.corner.nw {
    cursor: nw-resize;
    width: $handle-size + $corner-size;
    height: $handle-size;
    left: $handle-margin;
    top: $handle-margin;

    &::after {
      display: block;
      position: absolute;
      content: '';
      left: 0rem;
      top: $handle-size;
      width: $handle-size;
      height: $corner-size;
    }
  }

  .resize.corner.ne {
    cursor: ne-resize;
    width: $handle-size + $corner-size;
    height: $handle-size;
    right: $handle-margin;
    top: $handle-margin;

    &::after {
      display: block;
      position: absolute;
      content: '';
      right: 0rem;
      top: $handle-size;
      width: $handle-size;
      height: $corner-size;
    }
  }

  .resize.corner.se {
    cursor: se-resize;
    right: $handle-margin;
    bottom: $handle-margin;
    width: $handle-size + $corner-size;
    height: $handle-size;

    &::after {
      display: block;
      position: absolute;
      content: '';
      right: 0rem;
      bottom: $handle-size;
      width: $handle-size;
      height: $corner-size;
    }
  }

  .resize.corner.sw {
    cursor: sw-resize;
    width: $handle-size + $corner-size;
    height: $handle-size;
    left: $handle-margin;
    bottom: $handle-margin;

    &::after {
      display: block;
      position: absolute;
      content: '';
      left: 0rem;
      bottom: $handle-size;
      width: $handle-size;
      height: $corner-size;
    }
  }

  .inner {
    display: grid;
    width: 100%;
    height: 100%;
    padding: math.div(3rem, 16);

    grid-template-columns: min-content 1fr min-content;
    grid-template-rows: min-content auto min-content;
    grid-template-areas:
      'actions handle manage'
      'main main main'
      'footer footer footer';

    column-gap: math.div(3rem, 16);

    border-top: var(--frame-border-size) solid var(--color-background-50);
    border-left: var(--frame-border-size) solid var(--color-background-50);
    border-bottom: var(--frame-border-size) solid var(--color-background-600);
    border-right: var(--frame-border-size) solid var(--color-background-600);
  }

  .actions {
    grid-area: actions;
    align-self: center;
    user-select: none;
  }

  .handle {
    grid-column-start: actions;
    grid-column-end: manage;
    grid-row: 1;
    align-self: center;
    user-select: none;

    display: block;
    flex: 1;
    overflow: hidden;
    height: math.div(22rem, 16);
    font-size: 12px;
    font-weight: bold;
    line-height: math.div(20rem, 16);
    color: var(--color-on-window-bar-inactive);
    background: var(--color-window-bar-inactive);

    border-top: var(--frame-border-size) solid var(--color-background-600);
    border-left: var(--frame-border-size) solid var(--color-background-600);
    border-right: var(--frame-border-size) solid var(--color-background-50);

    > .handle-contents {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      padding: 0 math.div(11rem, 16);
    }

    > .handle-bottom {
      height: 0px;
      border-top: var(--frame-border-size) solid var(--color-background-50);
    }
  }

  .actions + .handle {
    grid-column-start: handle;
  }

  .manage + .handle {
    grid-column-end: handle;
  }

  .focused > .inner > .handle {
    color: var(--color-on-window-bar-active);
    background: var(--color-window-bar-active);
  }

  .manage {
    grid-area: manage;
    align-self: center;

    padding-right: math.div(1rem, 16);
  }

  .body {
    grid-area: main;
  }

  .maximized {
    width: 100vw !important;
    left: 0px !important;
    top: var(--taskbar-height) !important;
    height: calc(100vh - var(--taskbar-height)) !important;
  }
</style>
