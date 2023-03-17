import { WebrtcProvider } from 'y-webrtc';
// import { IndexeddbPersistence } from 'y-indexeddb';
import { Cursors } from './cursor.svelte';
import { OS } from './os'

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

// const baseConfig = {
//   driver: localforage.LOCALSTORAGE,
//   name: 'app',
//   version: 1.0,
//   description: 'wow'
// }

// const storages: Map<string, Store<any, any>> = new Map()

// export interface Storable<A> extends Writable<A> {
//   //subscribeAll: (this: void, run: Subscriber<A>, invalidate?: (value?: A | undefined) => void | undefined) => Unsubscriber
//   //onDestroy: () => void
// }

// export class Store<A extends Indexed<I>, I> {
//   private mutex: Mutex = new Mutex()
//   private storableMutex: Mutex = new Mutex()
//   private index: I
//   private collection: LocalForage
//   private indexer: (currentIndex: I | null) => I
//   private serializer: Iso<I, string>
//   private storables: Map<I, Storable<A>> = new Map()

//   private constructor(
//     index: I,
//     collection: LocalForage,
//     indexer: (currentIndex: I | null) => I,
//     serializer: Iso<I, string>
//   ) {
//     this.index = index
//     this.collection = collection
//     this.indexer = indexer
//     this.serializer = serializer
//   }

//   static async new<A extends Indexed<I>, I>(
//     name: string,
//     indexer: (currentIndex: I | null) => I,
//     serializer: Iso<I, string>
//   ): Promise<Store<A, I>> {
//     const collection = localforage.createInstance({ ...baseConfig, storeName: name })

//     const index = await collection.getItem<I>('index') ?? indexer(null)

//     const store: Store<A, I> = new Store(index, collection, indexer, serializer)

//     if (storages.has(name)) {
//       throw `Attempted to create duplicate store name: ${name}`
//     }
//     storages.set(name, store)

//     return store
//   }

//   async select<B>(f: (value: A) => B): Promise<B[]> {
//     const results: B[] = []
//     await this.collection.iterate<A, void>((value, key) => {
//       if (key !== 'index') {
//         results.push(f(value))
//       }
//     })
//     return results
//   }

//   async notify(index: string): Promise<void> {
//     const value = await this.collection.getItem<A>(index)

//     if (value === null) { return }

//     this.storables.get(this.serializer.from(index))?.set(value)
//   }

//   async notifyDestroy(index: string): Promise<void> {

//   }

//   async remove(index: I): Promise<void> {
//     await this.mutex.asyncWith(async () => {
//       await this.collection.removeItem(this.serializer.to(index))
//     })
//   }

//   async insert(value: Omit<A, "id">): Promise<A> {
//     return await this.mutex.asyncWith(async () => {
//       const current = this.index
//       const next = this.indexer(current)
//       this.index = next

//       await this.collection.setItem<I>("index", next)
//       return await this.collection.setItem<A>(
//         this.serializer.to(current),
//         { ...value, id: current } as A
//       )
//     })
//   }

//   private async lookup(index: I | null | undefined): Promise<A> {
//     if (index !== null && index !== undefined) {
//       const result = await this.collection.getItem<A>(this.serializer.to(index))
//       if (result === undefined || result === null) {
//         throw 'Unable to find item'
//       } else {
//         return result
//       }
//     }

//     throw 'Unable to find item'
//   }

//   private async lookupDefault(index: I | null | undefined, def: Omit<A, "id">): Promise<A> {
//     if (index === null || index === undefined) {
//       return await this.insert(def)
//     }

//     return await this.collection.getItem(this.serializer.to(index)) ?? await this.insert(def)
//   }

//   private async unsafeUpdate(def: A): Promise<A> {
//     return await this.mutex.asyncWith(async () => {
//       return await this.collection.setItem(this.serializer.to(def.id), def)
//     })
//   }

//   async storable(index: I | null | undefined, def?: Omit<A, "id">): Promise<Storable<A>> {
//     let existing = index !== null && index !== undefined ? this.storables.get(index) : null
//     if (existing) { return existing }

//     return await this.storableMutex.asyncWith(async () => {
//       existing = index !== null && index !== undefined ? this.storables.get(index) : null
//       if (existing) { return existing }

//       const existingValue =
//         (def === null || def === undefined)
//           ? await this.lookup(index)
//           : await this.lookupDefault(index, def)

//       const w = writable(existingValue)

//       let updateTimer: number | undefined

//       w.subscribe(async (value) => {
//         this.unsafeUpdate(value)

//         clearTimeout(updateTimer)
//         let timer: number = updateTimer = setTimeout(() => {
//           if (timer === updateTimer) {
//             updateTimer = undefined;
//             this.unsafeUpdate(value)
//           }
//         }, 50);
//       })

//       this.storables.set(existingValue.id, w)

//       return w
//     })
//   }
// }

// const eventMutex = new Mutex()
// const storageEvents: Map<string, { event: StorageEvent, storeName: string, index: string }> = new Map()
// let syncTimer: number;

// function updateStores() {
//   storageEvents.forEach(({ event, storeName, index }, _) => {
//     const store = storages.get(storeName)

//     if (event.newValue === null) {
//       store?.notifyDestroy(index)
//     } else {
//       store?.notify(index)
//     }
//   })
// }

// addEventListener('storage', (event: StorageEvent) => {
//   if (!event.key) { return; }

//   const [instance, storeName, ...directory] = event.key.split('/')

//   if (instance !== baseConfig.name) { return; }
//   if (!storages.has(storeName)) { return; }
//   if (directory.length === 0) { return; }

//   const index = directory.join('/')

//   storageEvents.set(event.key, { event, storeName, index })

//   clearTimeout(syncTimer)
//   syncTimer = setTimeout(() => {
//     eventMutex.with(() => {
//       updateStores()
//       storageEvents.clear()
//     })
//   }, 50)
// })

// export interface Indexed<T> {
//   readonly id: T
// }
