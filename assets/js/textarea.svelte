<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { Editor } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import Collaboration from '@tiptap/extension-collaboration';
  import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
  import type { XmlFragment } from 'yjs';
  import { getColorForName } from './user_colors';

  import { localUser, provider } from './os';

  const dispatch = createEventDispatcher<{ update: void }>();

  export let doc: XmlFragment;

  let element: HTMLElement;
  let editor: Editor;

  onMount(() => {
    editor = new Editor({
      element,
      extensions: [
        StarterKit.configure({
          history: false,
        }),
        Collaboration.configure({
          fragment: doc,
        }),
        CollaborationCursor.configure({
          provider: provider,
          user: {
            name: localUser,
            color: getColorForName(localUser),
          },
        }),
      ],
      onTransaction: () => {
        // force re-render so `editor.isActive` works as expected
        editor = editor;
      },
      onUpdate: () => {
        dispatch('update');
      },
    });
  });

  onDestroy(() => {
    if (editor) {
      editor.destroy();
    }
  });
</script>

<div class="editor" bind:this={element} />

<style lang="scss">
  .editor {
    background-color: #fff;

    min-height: 4rem;

    border-top: var(--frame-border-size) solid var(--color-background-600);
    border-left: var(--frame-border-size) solid var(--color-background-600);
    border-bottom: var(--frame-border-size) solid var(--color-background-900);
    border-right: var(--frame-border-size) solid var(--color-background-900);

    color: #0d0d0d;
    display: flex;
    flex-direction: column;
    max-height: 26rem;

    :global(.editor__header) {
      align-items: center;
      border-bottom: 3px solid #0d0d0d;
      display: flex;
      flex: 0 0 auto;
      flex-wrap: wrap;
      padding: 0.25rem;
    }

    :global(.editor__content) {
      flex: 1 1 auto;
      overflow-x: hidden;
      overflow-y: auto;
      //padding: 1.25rem 1rem;
      -webkit-overflow-scrolling: touch;
    }

    :global(.editor__footer) {
      align-items: center;
      border-top: 3px solid #0d0d0d;
      color: #0d0d0d;
      display: flex;
      flex: 0 0 auto;
      font-size: 12px;
      flex-wrap: wrap;
      font-weight: 600;
      justify-content: space-between;
      padding: 0.25rem 0.75rem;
      white-space: nowrap;
    }

    /* Some information about the status */
    :global(.editor__status) {
      align-items: center;
      border-radius: 5px;
      display: flex;

      &::before {
        background: rgba(#0d0d0d, 0.5);
        border-radius: 50%;
        content: ' ';
        display: inline-block;
        flex: 0 0 auto;
        height: 0.5rem;
        margin-right: 0.5rem;
        width: 0.5rem;
      }

      :global(.editor__status--connecting)::before {
        background: #616161;
      }

      :global(.editor__status--connected)::before {
        background: #b9f18d;
      }
    }

    :global(.editor__name) {
      :global(button) {
        background: none;
        border: none;
        border-radius: 0.4rem;
        color: #0d0d0d;
        font: inherit;
        font-size: 12px;
        font-weight: 600;
        padding: 0.25rem 0.5rem;

        &:hover {
          background-color: #0d0d0d;
          color: #fff;
        }
      }
    }

    /* Give a remote user a caret */
    :global(.collaboration-cursor__caret) {
      user-select: none;
      border-left: 1px solid #0d0d0d;
      border-right: 1px solid #0d0d0d;
      margin-left: -1px;
      margin-right: -1px;
      pointer-events: none;
      position: relative;
      word-break: normal;
    }

    /* Render the username above the caret */
    :global(.collaboration-cursor__label) {
      user-select: none;
      color: #0d0d0d;
      font-size: 12px;
      font-style: normal;
      font-weight: 600;
      left: -1px;
      line-height: normal;
      padding: 0.12rem 0.32rem;
      position: absolute;
      top: -1.4em;
      user-select: none;
      white-space: nowrap;

      box-shadow: 2px 2px 0px inset rgba(0, 0, 0, 0.35),
        -2px -2px 0px inset rgba(0, 0, 0, 0.45);
    }

    // Prosemirror stuff
    :global(.ProseMirror) {
      flex-grow: 1;

      :global(> * + *) {
        margin-top: 0.75em;
      }

      :global(p) {
        margin: 0.1rem;
      }

      :global(:where(ul, ol)) {
        padding: 0 1rem;
      }

      :global(:where(h1, h2, h3, h4, h5, h6)) {
        line-height: 1.1;
      }

      :global(code) {
        background-color: rgba(#616161, 0.1);
        color: #616161;
      }

      :global(pre) {
        background: #0d0d0d;
        border-radius: 0.5rem;
        color: #fff;
        font-family: 'JetBrainsMono', monospace;
        padding: 0.75rem 1rem;

        :global(code) {
          background: none;
          color: inherit;
          font-size: 0.8rem;
          padding: 0;
        }
      }

      :global(mark) {
        background-color: #faf594;
      }

      :global(img) {
        height: auto;
        max-width: 100%;
      }

      :global(hr) {
        margin: 1rem 0;
      }

      :global(blockquote) {
        border-left: 2px solid rgba(#0d0d0d, 0.1);
        padding-left: 1rem;
      }

      :global(hr) {
        border: none;
        border-top: 2px solid rgba(#0d0d0d, 0.1);
        margin: 2rem 0;
      }

      :global(ul[data-type='taskList']) {
        list-style: none;
        padding: 0;

        :global(li) {
          align-items: center;
          display: flex;

          :global(> label) {
            flex: 0 0 auto;
            margin-right: 0.5rem;
            user-select: none;
          }

          :global(> div) {
            flex: 1 1 auto;
          }
        }
      }
    }
  }
</style>
