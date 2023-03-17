import type { ContextMenuDefinition } from './context_menu.svelte';

export interface ContextMenuEvent {
  x: number,
  y: number,
  entries: ContextMenuDefinition
}