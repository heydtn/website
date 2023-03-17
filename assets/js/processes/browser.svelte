<script lang="ts" context="module">
  import { Process } from '../processes';
  import Browser from './browser.svelte';
  import { Map as YMap, Text as YText } from 'yjs';

  interface Args {
    webpage?: string;
  }

  type Data = YMap<YText>;

  class BrowserProcess extends Process<Args, Data, void> {
    component = Browser;
    type = 'Browser';

    initializeData(args?: Args) {
      return new YMap<YText>([['text1', new YText('')]]);
    }
  }

  Process.register('Browser', BrowserProcess);
</script>

<script lang="ts">
  import WindowComponent, { type WindowEvent } from '../window.svelte';
  import WindowContainer from '../window_container.svelte';
  import type { Window } from '../windows';

  export let process: BrowserProcess;

  let window1: Window | undefined;

  let text1: string | undefined;

  process.window('window1', (v) => {
    window1 = v;
  });

  // process.subscribeData((newData) => {
  //   data = newData;
  // });

  $: title = text1 ? `Nextsplore - ${text1}` : 'Nextsplore';
</script>

<WindowContainer>
  {#if window1}
    <WindowComponent
      {title}
      window={window1}
      on:close={process.handleWindowClose('window1')}
    >
      <textarea bind:value={text1} style:width="100%" style:resize="none" />
    </WindowComponent>
  {/if}
</WindowContainer>
