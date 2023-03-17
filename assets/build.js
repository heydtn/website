const esbuild = require('esbuild')
const { sassPlugin: esbuildSass } = require('esbuild-sass-plugin')
const esbuildSvelte = require('esbuild-svelte')
const esbuildInlineImage = require('esbuild-plugin-inline-image')
const esbuildInlineImport = require('esbuild-plugin-inline-import')

const svelteConfig = require('./svelte.config.js')

const args = process.argv.slice(2)
const watch = args.includes('--watch')
const deploy = args.includes('--deploy')

const plugins = [
  esbuildInlineImage({
    extensions: ["jpg", "jpeg", "png", "gif", "svg", "webp", "avif", "bmp", "BMP"]
  }),
  esbuildSass(),
  esbuildSvelte(svelteConfig)
]

let opts = {
  entryPoints: ['js/app.ts'],
  mainFields: ['svelte', 'browser', 'module', 'main'],
  bundle: true,
  outdir: '../priv/static/assets',
  target: 'es2022',
  format: 'esm',
  loader: {
    '.eot': 'file',
    '.woff': 'file',
    '.ttf': 'file',
    '.svg': 'file',
    '.otf': 'file'
  },
  plugins
}

if (watch) {
  opts = {
    ...opts,
    watch,
    sourcemap: 'inline'
  }
}

if (deploy) {
  opts = {
    ...opts,
    minify: true
  }
}

let build = esbuild.build(opts)

if (watch) {
  build = build.then(_result => {
    process.stdin.on('close', () => {
      process.exit(0)
    })

    process.stdin.resume()
  })
}

build = build.catch(() => process.exit(1))
