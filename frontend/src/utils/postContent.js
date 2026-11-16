// Convert plain-text posts into the line structure used by the editor.
export function plainLines(text) {
  return text.split('\n').map((line) => [{ text: line }])
}

const RICH_POST_TYPE = 'mosalinx-rich-text'
const RICH_POST_VERSION = 1

// Convert formatted editor lines into a versioned storage string.
export function serializePostContent(lines) {
  return JSON.stringify({
    type: RICH_POST_TYPE,
    version: RICH_POST_VERSION,
    lines,
  })
}

// Restore formatted posts while supporting existing plain-text content.
export function deserializePostContent(content) {
  if (typeof content !== 'string') {
    return plainLines('')
  }

  try {
    const parsed = JSON.parse(content)

    if (
      parsed?.type === RICH_POST_TYPE &&
      parsed.version === RICH_POST_VERSION &&
      Array.isArray(parsed.lines) &&
      parsed.lines.every((line) =>
        Array.isArray(line) &&
        line.every((run) =>
          run !== null &&
          typeof run === 'object' &&
          typeof run.text === 'string' &&
          ['bold', 'italic', 'underline'].every((key) =>
            run[key] === undefined || typeof run[key] === 'boolean'
          )
        )
      )
    ) {
      return parsed.lines
    }
  } catch {
    // Existing plain-text posts are not JSON.
  }

  return plainLines(content)
}
