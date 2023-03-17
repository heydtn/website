import { Doc as YDoc, Map as YMap, Array as YArray, YMapEvent } from 'yjs'

export type WindowArgs = {
  x: number
  y: number
  width: number
  height: number
  minimized: boolean
  maximized: boolean
}
export type WindowRoot = YMap<WindowArgsValues>

const windowDefault: () => WindowArgs = () => ({
  x: (window.innerWidth * 1 / 4) / 2,
  y: (window.innerWidth * 1 / 4) / 2,
  width: window.innerWidth * 3 / 4,
  height: window.innerHeight * 3 / 4,
  minimized: false,
  maximized: false
})
const windowKeys = Object.keys(windowDefault()) as (keyof WindowArgs)[]

type WindowArgsValues = WindowArgs[keyof WindowArgs]
const windowArgsValidators: { [P in keyof WindowArgs]: (value: any) => boolean } = {
  x: (value: any) => typeof value === 'number',
  y: (value: any) => typeof value === 'number',
  width: (value: any) => typeof value === 'number',
  height: (value: any) => typeof value === 'number',
  minimized: (value: any) => typeof value === 'boolean',
  maximized: (value: any) => typeof value === 'boolean'
}

export class Window {
  root: WindowRoot
  static rootType = YMap

  constructor(root?: Window['root'], args?: Partial<WindowArgs>) {
    this.root = root ? root : new YMap<WindowArgsValues>(Object.entries({ ...windowDefault(), ...args }).filter(([_, value]) => value !== undefined))
  }

  subscribe(f: (values: Partial<WindowArgs>) => void) {
    this.root.observe((event: YMapEvent<WindowArgsValues>) => {
      const result: Partial<WindowArgs> = {}

      windowKeys.forEach(field => {
        const changeSpec = event.keys.get(field)

        if (!changeSpec) { return }

        if (
          (changeSpec.action === "add" || changeSpec.action === "update")
          && windowArgsValidators[field](changeSpec.newValue)
        ) {
          result[field] = changeSpec.newValue
        }
      })

      f(result as WindowArgs)
    })
  }

  update(values: Partial<WindowArgs>): void {
    if (this.root.doc) {
      this.root.doc.transact(() => {
        this.updateValues(values)
      })
    } else {
      this.updateValues(values)
    }
  }

  private updateValues(values: Partial<WindowArgs>): void {
    let key: keyof WindowArgs

    for (key in values) {
      const val = values[key]

      if (val === undefined) { continue }

      this.root.set(key, val)
    }
  }
}