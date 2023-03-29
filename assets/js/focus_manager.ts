import { Array as YArray, Doc as YDoc, Map as YMap } from 'yjs'
import type { ProcessID } from './processes'
import type { WindowID } from './windows'

export class FocusManager {
  private set: YOrderedSet<[ProcessID, WindowID]>

  static docGetFocusManager(doc: YDoc, index: string) {
    const set = YOrderedSet.docGetOrderedSet<[ProcessID, WindowID]>(
      doc,
      index,
      ([processID, windowID]) => `${processID}|${windowID}`
    )

    return new FocusManager(set)
  }

  constructor(set: FocusManager['set']) {
    this.set = set
  }

  focus(processID: ProcessID, windowID: WindowID) {
    this.set.bump([processID, windowID])
  }

  delete(processID: ProcessID, windowID: WindowID) {
    this.set.delete([processID, windowID])
  }

  deleteBy(f: (processID: ProcessID, windowID: WindowID) => boolean) {
    this.set.deleteBy(([processID, windowID]) => f(processID, windowID))
  }
}

class YOrderedSet<A> {
  root: YMap<typeof this.map | typeof this.array>
  private hashFun: (value: A) => string
  private map: YMap<number>
  private array: YArray<A>

  static docGetOrderedSet<A>(doc: YDoc, index: string, hashFun: YOrderedSet<A>['hashFun']): YOrderedSet<A> {
    let result: YOrderedSet<A>

    doc.transact(() => {
      const root: YOrderedSet<A>['root'] = doc.getMap(index)

      let map = root.get('map')
      let array = root.get('array')

      if (map === undefined && array instanceof YArray) {
        const mapEntries: [string, number][] = array.map((item, index) => [hashFun(item), index])
        map = new YMap(mapEntries)

        root.set('map', map)

        result = new YOrderedSet<A>(root, map, array, hashFun)
        return
      }

      map = new YMap()
      array = new YArray()

      root.set('map', map)
      root.set('array', array)

      result = new YOrderedSet<A>(root, map, array, hashFun)
    })

    return result!
  }

  private constructor(root: YOrderedSet<A>['root'], map: YOrderedSet<A>['map'], array: YOrderedSet<A>['array'], hashFun: YOrderedSet<A>['hashFun']) {
    this.hashFun = hashFun
    this.root = root
    this.map = map
    this.array = array
  }

  deleteBy(f: (item: A) => boolean) {
    if (this.root.doc) {
      this.root.doc.transact(() => { this.deleteByOp(f) })
    } else {
      this.deleteByOp(f)
    }
  }

  private deleteByOp(f: (item: A) => boolean) {
    let lastChange;

    for (let i = this.array.length - 1; i >= 0; i--) {
      const item = this.array.get(i)

      if (f(item)) {
        const hashVal = this.hashFun(item)
        this.array.delete(i)
        this.map.delete(hashVal)
        lastChange = i
      }
    }

    if (lastChange !== undefined) {
      this.cascade(lastChange)
    }
  }

  delete(item: A): void {
    if (this.root.doc) {
      this.root.doc.transact(() => {
        this.deleteOp(item)
      })
    } else {
      this.deleteOp(item)
    }
  }

  private deleteOp(item: A) {
    const hashVal = this.hashFun(item)
    const index = this.map.get(hashVal)

    if (index !== undefined) {
      const itemAt = this.array.get(index)

      if (this.hashFun(itemAt) === hashVal) {
        this.map.delete(hashVal)
        this.array.delete(index)
        this.cascade(index)
      }
    }
  }

  bump(item: A): number {
    if (this.root.doc) {
      let result: number
      this.root.doc.transact(() => {
        result = this.bumpOp(item)
      })

      return result!
    } else {
      return this.bumpOp(item)
    }
  }

  private bumpOp(item: A): number {
    const hashVal = this.hashFun(item)
    const index = this.map.get(hashVal)

    if (index === undefined) { return this.push(hashVal, item) }

    const itemAt = this.array.get(index)
    if (this.hashFun(itemAt) === hashVal) { return this.move(index) }

    const maybePos = this.find(hashVal)
    if (maybePos !== undefined) { this.move(maybePos) }

    return this.push(hashVal, item)
  }

  private push(hashVal: string, item: A): number {
    this.array.push([item])
    const pos = this.array.length - 1
    this.map.set(hashVal, pos)
    return pos
  }

  private move(index: number): number {
    const value = this.array.get(index)
    this.array.delete(index)
    this.array.push([value])
    this.cascade(index)

    return this.array.length - 1
  }

  private find(hashVal: string): number | undefined {
    for (let i = 0; i < this.array.length; i++) {
      const val = this.array.get(i)

      if (this.hashFun(val) === hashVal) {
        return i
      }
    }
  }

  private cascade(index: number) {
    const fullLength = this.array.length

    for (let i = index; i < fullLength; i++) {
      const toAdjust = this.array.get(i)
      const hashFor = this.hashFun(toAdjust)
      this.map.set(hashFor, i)
    }
  }
}
