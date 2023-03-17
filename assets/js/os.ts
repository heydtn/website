import { Doc as YDoc, Map as YMap, type YMapEvent } from 'yjs'
import { Registry, Process, type ProcessRoot, type Unsubscriber } from './processes'

import { WebrtcProvider } from 'y-webrtc';
// import { IndexeddbPersistence } from 'y-indexeddb';
import { Cursors } from './cursor.svelte';

export type Processes = Map<string, Process<any, any, any>>

export class OS {
  root: YDoc
  processes: YMap<ProcessRoot>
  preparedProcesses: Processes = new Map()

  constructor(root?: YDoc) {
    this.root = root ? root : new YDoc({ autoLoad: true })

    let processes: typeof this.processes

    this.root.transact(() => {
      processes = this.root.getMap<YDoc>('processes')
    })

    this.processes = processes!

    this.loadProcesses()
    this.watch()
  }

  private loadProcesses() {
    this.processes.forEach((value, key) => {
      this.maybeLaunch(key, value)
    })
  }

  private maybeLaunch(key: string, value: YDoc) {
    const type = value.getMap<any>('info').get('type')
    if (!type) { return }

    const launcher = Registry.get(type)
    if (!launcher) { return }

    this.preparedProcesses.set(key, new launcher(undefined, value))
  }

  private watch() {
    this.processes.observe(event => {
      event.keys.forEach(({ action, newValue }, key) => {
        if (action === 'add' && newValue instanceof YDoc) {
          this.maybeLaunch(key, newValue)
        } else if (action === 'delete') {
          this.preparedProcesses.get(key)?.destroy()
          this.preparedProcesses.delete(key)
        } else if (action === 'update') {
          this.preparedProcesses.get(key)?.destroy()
          this.maybeLaunch(key, newValue)
        }
      })
    })
  }

  launch<P extends Process<any, any, any>>(process: P) {
    if (!process.getName()) {
      const name = crypto.randomUUID()

      this.root.transact(() => {
        process.setName(name)

        this.processes.set(name, process.root)
      })
    }
  }

  subscribeProcesses(f: (processes: OS['preparedProcesses']) => void): Unsubscriber {
    const observer = (event: YMapEvent<YDoc>) => {
      f(this.preparedProcesses)
    }

    f(this.preparedProcesses)

    this.processes.observe(observer)

    return () => this.processes.unobserve(observer)
  }
}

export const os = new OS()

const provider = new WebrtcProvider('main', os.root, { signaling: [] })
//const persister = new IndexeddbPersistence('main', mainDoc)
export const awareness = provider.awareness
export const localUser = crypto.randomUUID()

awareness.setLocalState({
  name: localUser,
  mousePosition: null,
  mouseType: Cursors.Default
})

// persister.on('synced', () => {
//   console.log('indexeddb content loaded')
// })

provider.on('synced', () => {
  console.log('rtc content loaded')
})
