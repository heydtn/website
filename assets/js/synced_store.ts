import { syncedStore, SyncedText, Y, getYjsDoc } from '@syncedstore/core'
import type { DocTypeDescription, MappedTypeDescription } from '@syncedstore/core/types/doc'
import { svelteSyncedStore } from '@syncedstore/svelte'
import { WebrtcProvider } from "y-webrtc";

type StorableNode
  = { [key: string]: StorableNode }
  | StorableNode[]
  | number
  | boolean
  | null
  | string

type StorableRoot
  = { [key: string]: StorableNode }
  | StorableNode[]
  | string

type StorableData = { [key: string]: StorableRoot }

// type WrappedNode
//   = { [key: string]: WrappedNode }
//   | WrappedNode[]
//   | number
//   | boolean
//   | null
//   | SyncedText

// type WrappedRoot
//   = { [key: string]: WrappedNode }
//   | WrappedNode[]
//   | string

// type WrappedData = { [key: string]: WrappedRoot }

// function wrapNode(data: StorableNode): WrappedNode {
//   if (Array.isArray(data)) {
//     return data.map<WrappedNode>(wrapNode)
//   } else if (typeof data === 'string') {
//     return new SyncedText(data)
//   } else if (typeof data === 'object') {
//     let newData: { [key: string]: WrappedNode } = {}

//     for (let key in data) {
//       newData[key] = wrapNode(data[key])
//     }

//     return newData
//   } else {
//     return data
//   }
// }

// function wrap(data: StorableData): WrappedData {
//   let result: WrappedData = {}

//   for (let key in data) {
//     if (Array.isArray(data[key])) {
//       result[key] = (data[key] as StorableRoot[]).map(wrapNode)
//     } else if (typeof data[key] === 'object') {
//       let newData: { [key: string]: WrappedNode } = {}

//       for (let key2 in (data[key] as Object)) {
//         newData[key2] = wrapNode((data[key] as { [key: string]: StorableNode })[key2])
//       }

//       result[key] = newData
//     } else {
//       result[key] = (data[key] as WrappedRoot)
//     }
//   }

//   return result
// }

// function specData(data: StorableData) {
//   let spec: DocTypeDescription = {};

//   for (let item in data) {
//     if (Array.isArray(data[item])) {
//       spec[item] = []
//     } else if (typeof data[item] === 'string') {
//       spec[item] = 'text'
//     } else if (typeof data[item] === 'object') {
//       spec[item] = {}
//     }
//   }

//   return spec
// }

// function syncedData(data: StorableData) {
//   const spec = specData(data)
//   const store = syncedStore(spec)
//   const wrapped = wrap(data)

//   for (let key in wrapped) {
//     if (Array.isArray(wrapped[key])) {
//       (wrapped[key] as WrappedNode[]).forEach(item => (store[key] as any[]).push(item))
//     } else if (typeof wrapped[key] === 'string') {
//       (store[key] as Y.Text).insert(0, (wrapped[key] as string))
//     } else if (typeof wrapped[key] === 'object') {
//       for (let key2 in (wrapped[key] as Object)) {
//         (store[key] as { [key: string]: any })[key2] = (wrapped[key] as { [key: string]: WrappedNode })[key2]
//       }
//     }
//   }

//   return store
// }

type Replaced<A, B, C> = A extends C ? A : (A extends B ? C : (A extends Array<infer P> ? Replaced<P, B, C>[] : (A extends Object ? { [P in keyof A]: Replaced<A[P], B, C> } : A)))

function wrap<A>(data: A): Replaced<A, string, SyncedText> {
  if (data instanceof Array) {
    return data.map(wrap) as Replaced<A, string, SyncedText>
  } else if (typeof data === 'string') {
    return new SyncedText(data) as Replaced<A, string, SyncedText>
  } else if (typeof data === 'object') {
    let result: Partial<{ [P in keyof A]: Replaced<A[P], string, SyncedText> }> = {};

    for (let key in data) {
      result[key] = wrap(data[key])
    }

    return result as Replaced<A, string, SyncedText>
  } else {
    return data as Replaced<A, string, SyncedText>
  }
}

function shape<A extends Object>(data: A) {
  const result: { [key: string]: [] | 'text' | {} } = {}

  for (let key in data) {
    if (data[key] instanceof Array) {
      result[key] = []
    } else if (typeof data[key] === 'string') {
      result[key] = 'text'
    } else {
      result[key] = {}
    }
  }

  return result
}

type Wrapped<A> =
  A extends string
  ? Y.Text
  : (A extends Array<infer P>
    ? Y.Array<Wrapped<P>>
    : (A extends Map<infer _, infer Q>
      ? Y.Map<Wrapped<Q>>
      : (A extends Record<string, infer R>
        ? Y.Map<Wrapped<R>>
        : A)))

type Testing = Wrapped<{ hello: number, yellow: { one: string } }>

export function synced<A extends StorableData>(data: A) {
  const wrapped = wrap(data)
  const dataShape = shape(data)

  const store = syncedStore<typeof wrapped>(dataShape as typeof wrapped)
  const svelte = svelteSyncedStore(store)
  const doc = getYjsDoc(store)

  window.myDoc = doc

  const webrtcProvider = new WebrtcProvider("test-id", doc, { signaling: [] })

  return svelte
}

export const store = synced({ hello: { wow: <number[]>[] } })

declare global {
  interface Window { Y: typeof Y, myDoc: Y.Doc }
}

window.Y = Y
