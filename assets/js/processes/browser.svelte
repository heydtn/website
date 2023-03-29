<script lang="ts" context="module">
  import { Process } from '../processes';
  import Browser from './browser.svelte';
  import { Map as YMap, Text as YText, XmlFragment as YXmlFragment } from 'yjs';

  export interface Args {
    webpage?: string;
  }

  export type Data = YXmlFragment;

  export class BrowserProcess extends Process<Args, Data, void> {
    get component() {
      return Browser;
    }
    get type() {
      return 'Browser';
    }

    data(args?: Args) {
      return new YMap<YXmlFragment>([['text1', new YXmlFragment()]]);
    }
  }

  Process.register('Browser', BrowserProcess);

  declare global {
    interface Window {
      BrowserProcess: typeof BrowserProcess;
    }
  }

  window.BrowserProcess = BrowserProcess;
</script>

<script lang="ts">
  import WindowComponent, { type WindowEvent } from '../window.svelte';
  import WindowContainer from '../window_container.svelte';
  import type { Window } from '../windows';
  import Textarea from 'js/textarea.svelte';

  export let process: BrowserProcess;

  let window1: Window | undefined;

  let text1: YXmlFragment | undefined;

  $: process.window('window1', (v) => {
    window1 = v;
  });

  $: process.subscribeData('text1', (text) => {
    text1 = text;
  });

  $: title = text1 ? `Nextsplore - ${text1.toDOM().textContent}` : 'Nextsplore';
</script>

<WindowContainer>
  {#if window1}
    <WindowComponent
      {title}
      window={window1}
      on:close={process.handleWindowClose('window1')}
    >
      {#if text1}<Textarea
          doc={text1}
          on:update={() => {
            text1 = text1;
          }}
        />{/if}
    </WindowComponent>
  {/if}
</WindowContainer>
