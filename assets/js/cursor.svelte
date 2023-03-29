<script lang="ts" context="module">
  export enum Cursors {
    Default = 'default',
    Grab = 'grab',
  }
</script>

<script lang="ts">
  import CursorDefault from '../images/cursors/default.svg';
  import CursorGrab from '../images/cursors/grab.svg';
  import { getColorForName } from './user_colors';

  export let name = 'unknown user';
  export let x = 0;
  export let y = 0;
  export let type: Cursors = Cursors.Default;

  const cursors = {
    [Cursors.Default]: CursorDefault,
    [Cursors.Grab]: CursorGrab,
  };

  $: cursor = cursors[type] || cursors[Cursors.Default];
  $: localUserColor = getColorForName(name);
</script>

<div class="cursor" style:left="{x}px" style:top="{y}px">
  <img class="image {type}" src={cursor} alt="Cursor for ${name}" />
  <span class="label" style:background-color={localUserColor}>{name}</span>
</div>

<style lang="scss">
  .cursor {
    display: block;
    position: absolute;
    pointer-events: none;
  }

  .image {
    position: relative;
    left: -2px;
    top: -3px;
    width: 0.75rem;
  }

  .label {
    background-color: white;
  }

  .grab {
    left: -6px;
    top: -3px;
    width: 0.9rem;
  }
</style>
