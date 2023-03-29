import { Doc as YDoc, Map as YMap, Array as YArray, YMapEvent } from 'yjs'
import type { Process } from './processes'

export type WindowArgs = {
  x: number
  y: number
  z: number
  width: number
  height: number
  minimized: boolean
  maximized: boolean
}
type WindowArgsValues = WindowArgs[keyof WindowArgs]
export type WindowRoot = YMap<WindowArgsValues>
export type WindowID = string

const windowDefault: () => WindowArgs = () => ({
  x: (window.innerWidth * 1 / 4) / 2,
  y: (window.innerWidth * 1 / 4) / 2,
  z: Number.MAX_SAFE_INTEGER,
  width: window.innerWidth * 3 / 4,
  height: window.innerHeight * 3 / 4,
  minimized: false,
  maximized: false
})
const windowKeys = Object.keys(windowDefault()) as (keyof Partial<WindowArgs>)[]

function isNumber(value: any): value is number {
  return typeof value === 'number'
}

function isBoolean(value: any): value is boolean {
  return typeof value === 'boolean'
}

const windowArgsValidators: { [P in keyof WindowArgs]: (value: any) => value is WindowArgs[P] } = {
  x: isNumber,
  y: isNumber,
  z: isNumber,
  width: isNumber,
  height: isNumber,
  minimized: isBoolean,
  maximized: isBoolean
}

type WindowUpdateArgs = Omit<WindowArgs, "z">

export class Window {
  root: WindowRoot
  static rootType = YMap

  parent: Process<any, any, any>

  constructor(opts: { parent: Window['parent'], root?: Window['root'], args?: Partial<WindowArgs> }) {
    this.root =
      opts.root
        ? opts.root
        : new YMap<WindowArgsValues>(
          Object.entries({ ...windowDefault(), ...opts.args })
            .filter(([_, value]) => value !== undefined)
        )

    this.parent = opts.parent
  }

  subscribe(f: (values: Partial<WindowArgs>) => void) {
    const initial: Partial<WindowArgs> = this.validateArgs({
      x: this.root.get('x'),
      y: this.root.get('y'),
      z: this.root.get('z'),
      width: this.root.get('width'),
      height: this.root.get('height'),
      minimized: this.root.get('minimized'),
      maximized: this.root.get('maximized')
    })

    f(initial)

    this.root.observe((event: YMapEvent<WindowArgsValues>) => {
      const result: { [type: string]: any } = {}
      let changed: boolean = false

      windowKeys.forEach((field) => {
        const changeSpec = event.changes.keys.get(field)

        if (changeSpec?.action === "add" || changeSpec?.action === "update") {
          const newValue = this.root.get(field)
          const validator = windowArgsValidators[field]

          if (validator(newValue)) {
            changed = true
            result[field] = newValue
          }
        }
      })

      if (changed) {
        f(result)
      }
    })
  }

  update(values: Partial<WindowUpdateArgs>): void {
    if (this.root.doc) {
      this.root.doc.transact(() => {
        this.updateValues(values)
      })
    } else {
      this.updateValues(values)
    }
  }

  destroy() { }

  private updateValues(values: Partial<WindowArgs>): void {
    let key: keyof WindowArgs

    for (key in values) {
      const val = values[key]

      if (val === undefined) { continue }

      this.root.set(key, val)
    }
  }

  private validateArgs(args: { [P in keyof Partial<WindowArgs>]: any }): Partial<WindowArgs> {
    let result: Partial<WindowArgs> = {}
    let key: keyof Partial<WindowArgs>

    for (key in args) {
      if (windowArgsValidators[key](args[key])) {
        result[key] = args[key]
      }
    }

    return result
  }
}
