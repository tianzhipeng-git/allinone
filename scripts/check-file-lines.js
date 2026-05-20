import { readdirSync, readFileSync } from 'node:fs'
import { extname, join, relative } from 'node:path'

const MAX_LINES = 666
const CODE_EXTENSIONS = new Set([
  '.cjs',
  '.js',
  '.jsx',
  '.mjs',
  '.rs',
  '.ts',
  '.tsx',
])
const IGNORED_DIRECTORIES = new Set(['.git', 'dist', 'node_modules', 'target'])

function countLines(content) {
  if (content.length === 0) {
    return 0
  }

  const lines = content.split(/\r\n|\r|\n/)

  if (lines.at(-1) === '') {
    lines.pop()
  }

  return lines.length
}

function collectCodeFiles(directory, files = []) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!IGNORED_DIRECTORIES.has(entry.name)) {
        collectCodeFiles(join(directory, entry.name), files)
      }
      continue
    }

    if (entry.isFile() && CODE_EXTENSIONS.has(extname(entry.name))) {
      files.push(join(directory, entry.name))
    }
  }

  return files
}

const root = process.cwd()
const oversizedFiles = collectCodeFiles(root)
  .map(file => {
    const lineCount = countLines(readFileSync(file, 'utf8'))

    return {
      file,
      lineCount,
    }
  })
  .filter(({ lineCount }) => lineCount > MAX_LINES)
  .sort((left, right) => right.lineCount - left.lineCount)

if (oversizedFiles.length > 0) {
  console.error(`Code files must be ${MAX_LINES} lines or fewer.`)

  for (const { file, lineCount } of oversizedFiles) {
    console.error(
      `  ${relative(root, file)} has ${lineCount} lines (${lineCount - MAX_LINES} over)`
    )
  }

  process.exitCode = 1
}
