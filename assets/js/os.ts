import { Array as YArray, Doc as YDoc, Map as YMap, type YMapEvent } from 'yjs'
import { Process, Processes } from './processes'
import { FocusManager } from './focus_manager'

import { WebrtcProvider } from 'y-webrtc';
// import { IndexeddbPersistence } from 'y-indexeddb';
import { Cursors } from './cursor.svelte';

export class OS {
  root: YDoc

  processes: Processes
  focus: FocusManager

  constructor(root?: YDoc) {
    this.root = root ? root : new YDoc({ autoLoad: true })

    let processes: typeof this.processes
    let focus: typeof this.focus

    this.root.transact(() => {
      processes = Processes.docGetProcesses(this.root, 'processes')
      focus = FocusManager.docGetFocusManager(this.root, 'focus')
    })

    this.processes = processes!
    this.focus = focus!
  }
}

export const os = new OS()

export const provider = new WebrtcProvider('main', os.root, { signaling: [] })
//const persister = new IndexeddbPersistence('main', mainDoc)
export const awareness = provider.awareness
export const localUser = crypto.randomUUID()

awareness.setLocalState({
  name: localUser,
  mousePosition: null,
  mouseType: Cursors.Default
})

declare global {
  interface Window { os: OS, YArray: typeof YArray, YDoc: typeof YDoc }
}
window.os = os
window.YArray = YArray
window.YDoc = YDoc