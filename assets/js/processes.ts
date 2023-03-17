// import { Store, type Storable, type Indexed } from './store'

// List of all applications
// import BrowserComponent, * as Browser from './processes/browser.svelte'
// import type { Unsubscriber } from 'svelte/store';
// import type { WindowEvent } from './window.svelte';

import type { SvelteComponent } from 'svelte'
import { Doc as YDoc, Map as YMap, Array as YArray, YMapEvent } from 'yjs'
import { Window, type WindowRoot, type WindowArgs } from './windows'
import { os } from './store'
// End applications

// export type ProcessID = string;
// export type UnlaunchedProcess<M, T> = Omit<ProcessData<M, T>, "id" | "mailbox" | "windows">
// export type ProcessRoute = Pick<ProcessData<any, any>, "id"> & { component: Registry[keyof Registry]["Component"] }

// export type WindowHandle = string;
// export interface WindowData extends Indexed<WindowHandle> {
//   x: number
//   y: number
//   width: number
//   height: number
//   minimized: boolean
//   maximized: boolean
// }

// export interface ProcessData<M, T> extends Indexed<ProcessID> {
//   readonly type: keyof Registry
//   mailbox: M[]
//   data: T
//   windows: { [key: string]: WindowData }
// }

// export const Processes = await Store.new<ProcessData<any, any>, string>(
//   'processes',
//   () => crypto.randomUUID(),
//   { to: (a) => a, from: (a) => a }
// )

// export function getRoute<M, T>(processData: ProcessData<M, T>): ProcessRoute {
//   return { id: processData.id, component: Process.Types[processData.type].Component }
// }

// export type ProcessRoutes = ProcessRoute[];
// export async function processRoutes(): Promise<ProcessRoutes> {
//   return await Processes.select((processData) => {
//     return getRoute(processData)
//   });
// }

// export class Process<M, T> {
//   private processStorable: Storable<ProcessData<M, T>>

//   private constructor(storable: Storable<ProcessData<M, T>>) {
//     this.processStorable = storable
//   }

//   static async new<M, T>(index: ProcessID): Promise<Process<M, T>> {
//     const storable: Storable<ProcessData<M, T>> = await Processes.storable(index)

//     return new Process(storable)
//   }

//   static async launch<M, T>(def: UnlaunchedProcess<M, T>): Promise<ProcessRoute> {
//     const process = await Processes.insert({ ...def, windows: {}, mailbox: [] })
//     return getRoute(process)
//   }

//   subscribe(f: (value: ProcessData<M, T>) => void): Unsubscriber {
//     return this.processStorable.subscribe(f)
//   }

//   async window(name: string, def: Omit<WindowData, "id">): Promise<void> {
//     this.processStorable.update((value: ProcessData<M, T>) => {
//       if (value.windows[name]) {
//         return value
//       } else {
//         return {
//           ...value,
//           windows: { ...value.windows, [name]: { ...def, id: crypto.randomUUID() } }
//         }
//       }
//     })
//   }

//   updateData(data: T) {
//     this.processStorable.update((value: ProcessData<M, T>) => {
//       return {
//         ...value,
//         data
//       }
//     })
//   }

//   updateWindow(name: string, def: WindowData): void {
//     this.processStorable.update((value: ProcessData<M, T>) => {
//       return {
//         ...value,
//         windows: { ...value.windows, [name]: { ...def } }
//       }
//     })
//   }

//   focusWindow(name: string): void {

//   }

//   closeWindow(name: string): void {
//     this.processStorable.update((value: ProcessData<M, T>) => {
//       const newWindows = { ...value.windows }
//       delete newWindows[name]

//       return {
//         ...value,
//         windows: newWindows
//       }
//     })
//   }

//   handleWindowChange(name: string): (event: CustomEvent<WindowEvent>) => void {
//     return (event: CustomEvent<WindowEvent>) => { this.updateWindow(name, event.detail as WindowData) }
//   }

//   handleWindowClose(name: string): (event: CustomEvent<void>) => void {
//     return (event: CustomEvent<void>) => { this.closeWindow(name) }
//   }

//   closeAllWindows(): void {
//     this.processStorable.update((value: ProcessData<M, T>) => {
//       return { ...value, windows: {} }
//     })
//   }

//   static readonly Types: Registry = {
//     Browser: { Type: 'Browser', Component: BrowserComponent, start: Browser.start }
//   }
// }

type Registry<C extends Process<A, any, any>, A> = Map<string, new (root?: YDoc, args?: A) => C>
export const Registry: Registry<any, any> = new Map()

export type Unsubscriber = () => void

export type ProcessRoot = YDoc

export abstract class Process<A, D, M> {
  root: ProcessRoot
  static rootType = YDoc

  abstract component: typeof SvelteComponent

  private info: YMap<any>
  private data: D
  private mailbox: YArray<M>
  private windows: YMap<WindowRoot>

  static register<C extends Process<A, any, any>, A>(name: string, constructor: new (root?: YDoc, args?: A) => C) {
    if (name in Registry) {
      throw `Cannot register process ${name}, name already taken`
    }

    Registry.set(name, constructor)
  }

  constructor(args?: A, root?: YDoc) {
    this.root = root ? root : new YDoc({ autoLoad: true })

    let info: typeof this.info
    let data: typeof this.data
    let mailbox: typeof this.mailbox
    let windows: typeof this.windows

    this.root.transact(() => {
      info = this.initializeInfo()
      data = this.initializeData(args)
      mailbox = this.initializeMailbox(args)
      windows = this.initializeWindows(args)
    })

    this.info = info!
    this.data = data!
    this.mailbox = mailbox!
    this.windows = windows!
  }

  destroy() {
    this.root.destroy()
  }

  initializeInfo() {
    const info = this.root.getMap<any>('info')

    if (!info.get('startTime')) {
      info.set('startTime', new Date().toISOString())
    }

    return info
  }

  initializeWindows(args?: A): Process<A, D, M>['windows'] {
    return this.root.getMap<WindowRoot>('windows')
  }

  initializeMailbox(args?: A): Process<A, D, M>['mailbox'] {
    return this.root.getArray<M>('mailbox')
  }

  abstract initializeData(args?: A): Process<A, D, M>['data']

  stop() {
    this.root.destroy()
  }

  handleWindowClose(name: string): (event: CustomEvent<void>) => void {
    return (event: CustomEvent<void>) => { this.windowClose(name) }
  }

  windowClose(name: string) {
    this.windows.delete(name)
  }

  window(name: string, f: (value?: Window) => void, args?: Partial<WindowArgs>): Unsubscriber {
    let windowRoot = this.windows.get(name)
    let windowInst

    if (windowRoot instanceof Window.rootType) {
      windowInst = new Window(windowRoot, args)
    } else {
      windowInst = new Window(undefined, args)
      this.windows.set(name, windowInst.root)
    }

    f(windowInst)

    const subscriber = (event: YMapEvent<WindowRoot>) => {
      if (event.keys.has(name)) {
        const changes = event.keys.get(name)!

        if (changes.action === "delete") {
          f()
        } else if (changes.newValue instanceof Window.rootType) {
          f(new Window(changes.newValue))
        } else {
          f()
        }
      }
    }

    this.windows.observe(subscriber)

    return () => {
      this.windows.unobserve(subscriber)
    }
  }

  subscribeData(f: (value: Process<A, D, M>['data']) => void) {

  }

  getName() {
    return this.info.get('name')
  }

  setName(name: string) {
    this.info.set('name', name)
  }

  launch() {
    os.launch(this)
  }
}

declare global {
  interface Window { Process: typeof Process }
}

window.Process = Process
