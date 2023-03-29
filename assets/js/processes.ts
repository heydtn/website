import type { SvelteComponent } from 'svelte'
import { Doc as YDoc, Map as YMap, Array as YArray, YMapEvent } from 'yjs'
import { Window, type WindowRoot, type WindowArgs, type WindowID } from './windows'
import { os } from './os'

type Registry<C extends Process<A, any, any>, A> = Map<string, new (args?: A, root?: ProcessRoot) => C>
export const Registry: Registry<any, any> = new Map()

export type Unsubscriber = () => void

export type ProcessRoot = YMap<any>
export type ProcessID = string

export class Processes {
  root: YMap<ProcessRoot>
  private processes: Map<ProcessID, Process<any, any, any>> = new Map()

  static docGetProcesses(doc: YDoc, index: string) {
    const root = doc.getMap<ProcessRoot>(index)

    return new Processes(root)
  }

  private constructor(root: Processes['root']) {
    this.root = root

    this.loadProcesses()
    this.watch()
  }

  private loadProcesses() {
    this.root.forEach((_, key) => {
      const process = Process.mapGetProcess(this.root, key)

      if (process !== undefined) { this.processes.set(key, process) }
    })
  }

  private watch() {
    this.root.observe(event => {
      event.changes.keys.forEach(({ action }, key) => {
        if (action === 'add') {
          const process = Process.mapGetProcess(this.root, key)
          if (process !== undefined) { this.processes.set(key, process) }
        } else if (action === 'delete') {
          this.processes.get(key)?.destroy()
          this.processes.delete(key)
        } else if (action === 'update') {
          this.processes.get(key)?.destroy()

          const process = Process.mapGetProcess(this.root, key)
          if (process !== undefined) { this.processes.set(key, process) }
        }
      })
    })
  }

  listProcesses() {
    return this.processes;
  }

  subscribe(f: (processes: Processes) => void): Unsubscriber {
    const observer = (event: YMapEvent<ProcessRoot>) => {
      f(this)
    }

    f(this)

    this.root.observe(observer)

    return () => this.root.unobserve(observer)
  }

  start<P extends Process<any, any, any>>(process: P) {
    if (!process.id) {
      const name = crypto.randomUUID()
      const launch = () => {
        process.id = name

        this.root.set(name, process.root)
      }

      if (this.root.doc) {
        this.root.doc.transact(() => {
          launch()
        })
      } else {
        launch()
      }
    }
  }

  stop<P extends Process<any, any, any>>(process: P) {
    this.root.delete(process.id)
  }

  [Symbol.iterator]() {
    return this.processes.entries()
  }

  values() {
    return this.processes.values()
  }

  keys() {
    return this.processes.keys()
  }

  get length() { return this.processes.size }
}

export abstract class Process<A, D, M> {
  root: ProcessRoot
  static rootType = YMap

  abstract get component(): typeof SvelteComponent
  abstract get type(): string

  private _info: YMap<any>
  private _data: YMap<D>
  private _mailbox: YArray<M>
  private _windows: YMap<WindowRoot>
  windows: Map<WindowID, Window> = new Map()

  static register<C extends Process<A, any, any>, A>(name: string, constructor: new (args?: A, root?: ProcessRoot) => C): void {
    if (name in Registry) {
      throw `Cannot register process ${name}, name already taken`
    }

    Registry.set(name, constructor)
  }

  static mapGetProcess<P extends Process<any, any, any>>(map: YMap<ProcessRoot>, key: ProcessID): P | undefined {
    const maybeProcess = map.get(key)

    if (!Process.isValidRoot(maybeProcess)) { return }

    const type = maybeProcess.get('info')?.get('type')

    if (type === undefined) { return }

    const launcher = Registry.get(type)

    if (!launcher) { return }

    return new launcher(undefined, maybeProcess)
  }

  static isValidRoot(value: any): value is ProcessRoot {
    return value instanceof YMap
  }

  get id() {
    return this._info.get('id')
  }

  set id(id: ProcessID) {
    this._info.set('id', id)
  }

  constructor(args?: A, root?: ProcessRoot) {
    this.root = Process.isValidRoot(root) ? root : new YMap()

    let _info: typeof this._info
    let _data: typeof this._data
    let _mailbox: typeof this._mailbox
    let _windows: typeof this._windows

    const initialize = () => {
      _info = this.initializeInfo()
      _mailbox = this.initializeMailbox(args)
      _windows = this.initializeWindows(args)
      _data = this.initializeData(args)
    }

    if (this.root.doc) {
      this.root.doc.transact(initialize)
    } else {
      initialize()
    }

    this._info = _info!
    this._data = _data!
    this._mailbox = _mailbox!
    this._windows = _windows!
  }

  initializeInfo() {
    let infoRoot = this.root.get('info')

    if (!(infoRoot instanceof YMap)) {
      infoRoot = new YMap()
      this.root.set('info', infoRoot)
    }

    if (!infoRoot.get('startTime')) {
      infoRoot.set('startTime', new Date().toISOString())
    }
    if (!infoRoot.get('type')) {
      infoRoot.set('type', this.type)
    }

    return infoRoot
  }

  initializeWindows(args?: A): Process<A, D, M>['_windows'] {
    let windowsRoot = this.root.get('windows')
    if (!(windowsRoot instanceof YMap)) {
      windowsRoot = new YMap<WindowRoot>()
      this.root.set('windows', windowsRoot)
    }
    return windowsRoot
  }

  initializeMailbox(args?: A): Process<A, D, M>['_mailbox'] {
    let mailboxRoot = this.root.get('mailbox')
    if (!(mailboxRoot instanceof YArray)) {
      mailboxRoot = new YArray<M>()
      this.root.set('mailbox', mailboxRoot)
    }
    return mailboxRoot
  }

  initializeData(args?: A): Process<A, D, M>['_data'] {
    let dataRoot = this.root.get('data')
    if (dataRoot === undefined) {
      dataRoot = this.data(args)
      this.root.set('data', dataRoot)
    }

    return dataRoot
  }

  abstract data(args?: A): Process<A, D, M>['_data']

  handleWindowClose(name: string): (event: CustomEvent<void>) => void {
    return (event: CustomEvent<void>) => { this.windowClose(name) }
  }

  windowClose(name: string) {
    this.windows.delete(name)
    this._windows.delete(name)
  }

  window(name: string, f: (value?: Window) => void, args?: Partial<WindowArgs>): Unsubscriber {
    let windowRoot = this._windows.get(name)
    let windowInst: Window

    if (windowRoot instanceof Window.rootType) {
      windowInst = new Window({ parent: this, root: windowRoot })
    } else {
      windowInst = new Window({ parent: this, args })
    }

    this.windows.set(name, windowInst)

    const subscriber = (event: YMapEvent<WindowRoot>) => {
      if (event.changes.keys.has(name)) {
        const changes = event.changes.keys.get(name)

        if (changes?.action === "delete") {
          f()
        } else if (changes?.action === "add" || changes?.action === "update") {
          const newValue = this._windows.get(name)

          if (newValue instanceof Window.rootType) {
            f(new Window({ parent: this, root: newValue }))
          } else {
            f()
          }
        } else {
          f()
        }
      }
    }

    this._windows.observe(subscriber)

    if (!(windowRoot instanceof Window.rootType)) {
      this._windows.set(name, windowInst.root)
    } else {
      f(windowInst)
    }

    return () => {
      this._windows.unobserve(subscriber)
    }
  }

  subscribeData(name: string, f: (value?: D) => void) {
    const subscriber = (event: YMapEvent<D>) => {
      if (event.changes.keys.has(name)) {
        const changes = event.changes.keys.get(name)

        if (changes?.action === "delete") {
          f()
        } else if (changes?.action === "add" || changes?.action === "update") {
          const newValue = this._data.get(name)

          f(newValue)
        } else {
          f()
        }
      }
    }

    const existing = this._data.get(name)
    f(existing)
    this._data.observe(subscriber)

    return () => {
      this._data.unobserve(subscriber)
    }
  }

  start() {
    os.processes.start(this)
  }

  stop() {
    this.destroy()
    os.processes.stop(this)
  }

  destroy() {
    this.windows.forEach(window => {
      window.destroy()
    })

    os.focus.deleteBy(processID => processID === this.id)
  }
}
