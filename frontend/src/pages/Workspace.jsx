import { useEffect, useRef, useState } from 'react'
import { useProject } from '../context/useProject'
import { auth } from '../firebase'
import {
  createWorkspaceFile,
  updateWorkspaceFile,
  renameWorkspaceFile,
  listWorkspaceFiles,
  getWorkspaceFile,
} from '../services/workspaceFileService'
import './Workspace.css'

// ---------- Mock data / file-type definitions ----------
// No workspace backend exists yet, so the
// file tree, file contents, and "who else is viewing" presence are all local
// state seeded with sample data. Swapping in real persistence later means
// replacing the useState seeds below with fetched data.
// Editor logic doesn't need to change.

let idSeed = 1000
function nextId() {
  idSeed += 1
  return `n${idSeed}`
}

const ICONS = {
  chevron: (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M9 18l6-6-6-6" />
    </svg>
  ),
  folder: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  ),
  folderOpen: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2H3z" />
      <path d="M3 9h16.5a2 2 0 0 1 1.95 2.45l-1.2 5.4A2 2 0 0 1 18.3 18.6H5a2 2 0 0 1-2-2z" />
    </svg>
  ),
  document: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M14 3v5h5" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="15" y2="17" />
    </svg>
  ),
  spreadsheet: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="16" rx="1.5" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9.5" y1="4" x2="9.5" y2="20" />
      <line x1="15" y1="4" x2="15" y2="20" />
    </svg>
  ),
  presentation: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="13" rx="1.5" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </svg>
  ),
  sql: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
      <path d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
    </svg>
  ),
  code: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="8 6 2 12 8 18" />
      <polyline points="16 6 22 12 16 18" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  play: (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" stroke="none">
      <path d="M6 4l15 8-15 8z" />
    </svg>
  ),
}

const FILE_TYPES = {
  document: { label: 'Document', extension: '.modoc', icon: ICONS.document },
  spreadsheet: { label: 'Spreadsheet', extension: '.mosheet', icon: ICONS.spreadsheet },
  presentation: { label: 'Presentation', extension: '.moslide', icon: ICONS.presentation },
  sql: { label: 'SQL Query', extension: '.sql', icon: ICONS.sql },
  code: { label: 'Code File', extension: '.js', icon: ICONS.code },
}

const NEW_FILE_ORDER = ['document', 'spreadsheet', 'presentation', 'sql', 'code']

// Classic MS-Office-style ribbon: a tab strip + grouped tool clusters, with
// a signature accent color per app (Word blue, Excel green, PowerPoint
// orange; SQL/code get invented but analogous colors). Document is also the
// default/placeholder ribbon shown grayed out when nothing is selected.
const RIBBON_THEMES = {
  document: { accent: '#2b579a', tabs: ['Home', 'Insert', 'Design', 'Layout', 'References', 'Review', 'View'] },
  spreadsheet: { accent: '#217346', tabs: ['Home', 'Insert', 'Page Layout', 'Formulas', 'Data', 'Review', 'View'] },
  presentation: { accent: '#b7472a', tabs: ['Home', 'Insert', 'Design', 'Transitions', 'Animations', 'Slide Show', 'View'] },
  sql: { accent: '#5c2d91', tabs: ['Home', 'Query', 'Connection', 'View'] },
  code: { accent: '#007acc', tabs: ['Home', 'Run', 'Debug', 'View'] },
}

const SPREADSHEET_COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
const SPREADSHEET_ROWS = Array.from({ length: 16 }, (_, i) => i + 1)

const INITIAL_TREE = [
  {
    id: 'folder-docs',
    name: 'Documents',
    type: 'folder',
    children: [
      {
        id: 'file-proposal',
        name: 'Client Proposal.modoc',
        type: 'document',
        content:
          'Mosalinx Project Proposal\n\nOverview: this document outlines the scope, timeline, and deliverables for the upcoming engagement.\n\nNext steps: review with stakeholders and confirm the kickoff date.',
        bold: false,
        italic: false,
        underline: false,
        align: 'left',
      },
      {
        id: 'file-notes',
        name: 'Meeting Notes.modoc',
        type: 'document',
        content: '',
        bold: false,
        italic: false,
        underline: false,
        align: 'left',
      },
    ],
  },
  {
    id: 'folder-sheets',
    name: 'Spreadsheets',
    type: 'folder',
    children: [
      {
        id: 'file-budget',
        name: 'Budget.mosheet',
        type: 'spreadsheet',
        cells: { A1: 'Item', B1: 'Cost', A2: 'Hosting', B2: '120', A3: 'Licensing', B3: '450' },
        formats: {},
        viewers: [{ name: 'Veronica Johnson', color: '#4a8f5c' }],
      },
    ],
  },
  {
    id: 'folder-slides',
    name: 'Presentations',
    type: 'folder',
    children: [
      {
        id: 'file-pitch',
        name: 'Pitch Deck.moslide',
        type: 'presentation',
        slides: [
          { id: 'slide-1', title: 'Mosalinx', body: 'A cloud-based collaborative platform for creative teams.' },
          { id: 'slide-2', title: 'The Problem', body: 'Creative teams juggle too many disconnected tools.' },
        ],
        activeSlideIndex: 0,
      },
    ],
  },
  {
    id: 'folder-db',
    name: 'Database',
    type: 'folder',
    children: [
      {
        id: 'file-query',
        name: 'active_users.sql',
        type: 'sql',
        content: 'SELECT id, email, last_login\nFROM users\nWHERE active = 1\nORDER BY last_login DESC;',
        viewers: [{ name: 'Lesly Martinez', color: '#1b3a5c' }],
      },
    ],
  },
  {
    id: 'folder-src',
    name: 'Source',
    type: 'folder',
    children: [
      {
        id: 'file-app',
        name: 'app.js',
        type: 'code',
        content: "function main() {\n  console.log('Mosalinx is running')\n}\n\nmain()",
      },
    ],
  },
]

// ---------- Feed (posts + saved changes) ----------
// The feed has two separate streams, both local state seeded with samples
// until a backend exists:
//
// - posts: written in the post composer (rich text, images, linked files).
//   { id, user, avatarUrl, lines, images: [{ id, name, url }],
//     files: [{ id, name }], timestamp }
//   `lines` is the formatted body as plain data (see serializeEditor), so it
//   renders as React elements and never needs innerHTML.
//   Backend dev: images need uploading to storage (the url here is a
//   temporary in-browser object URL), and avatarUrl should come from the
//   user's profile_image_url.
//
// - changes (shown on the Activity tab): one entry per file action —
//   { id, projectId, user, action, fileId, fileName, timestamp } where action
//   is 'created', 'modified' or 'deleted' (see ACTIVITY_LABELS). Saving no
//   longer asks for a comment or creates a post.

// Words shown on the Activity tab. Entries with no action are old saves, so
// they read as Modified; an action we don't know reads as a neutral Updated.
const ACTIVITY_LABELS = { created: 'Created', modified: 'Modified', deleted: 'Deleted' }

function activityLabel(action) {
  if (!action) return ACTIVITY_LABELS.modified
  return ACTIVITY_LABELS[action] ?? 'Updated'
}

const NOW = Date.now()
const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE

const MAX_POST_IMAGES = 4
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

function plainLines(text) {
  return text.split('\n').map((line) => [{ text: line }])
}

const INITIAL_POSTS = [
  {
    id: 'post-1',
    projectId: null,
    user: 'Veronica Johnson',
    avatarUrl: null,
    lines: [
      [
        { text: 'Budget update: ', bold: true },
        { text: 'refreshed hosting and licensing costs to match the latest vendor quotes.' },
      ],
      [{ text: 'Let me know if anything looks off before the client review.', italic: true }],
    ],
    images: [],
    files: [{ id: 'file-budget', name: 'Budget.mosheet' }],
    timestamp: NOW - 45 * MINUTE,
  },
  {
    id: 'post-2',
    projectId: null,
    user: 'Lesly Martinez',
    avatarUrl: null,
    lines: plainLines('Filtered the user report to active accounts only and sorted by most recent login.'),
    images: [],
    files: [{ id: 'file-query', name: 'active_users.sql' }],
    timestamp: NOW - 5 * HOUR,
  },
  {
    id: 'post-3',
    projectId: null,
    user: 'Veronica Johnson',
    avatarUrl: null,
    lines: plainLines(
      'Added the overview section and next steps to the proposal.\nThe pitch deck still needs the problem slide tightened up.'
    ),
    images: [],
    files: [
      { id: 'file-proposal', name: 'Client Proposal.modoc' },
      { id: 'file-pitch', name: 'Pitch Deck.moslide' },
    ],
    timestamp: NOW - 26 * HOUR,
  },
]

const INITIAL_CHANGES = [
  { id: 'change-1', projectId: null, action: 'modified', user: 'Veronica Johnson', fileId: 'file-budget', fileName: 'Budget.mosheet', timestamp: NOW - 45 * MINUTE },
  { id: 'change-2', projectId: null, action: 'modified', user: 'Lesly Martinez', fileId: 'file-query', fileName: 'active_users.sql', timestamp: NOW - 5 * HOUR },
  { id: 'change-3', projectId: null, action: 'modified', user: 'Veronica Johnson', fileId: 'file-proposal', fileName: 'Client Proposal.modoc', timestamp: NOW - 26 * HOUR },
]

// Turns the composer's contentEditable DOM into plain data: an array of
// lines, each an array of { text, bold, italic, underline } runs. Anything
// that isn't text/bold/italic/underline/line breaks is dropped, so pasted or
// injected markup can't survive into a post.
function serializeEditor(root) {
  const lines = [[]]
  const currentLine = () => lines[lines.length - 1]
  const startNewLine = () => lines.push([])

  function walk(node, style) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.replace(/\u00A0/g, ' ')
      if (text) currentLine().push({ text, ...style })
      return
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return

    const tag = node.tagName
    if (tag === 'BR') {
      startNewLine()
      return
    }

    const next = { ...style }
    if (tag === 'B' || tag === 'STRONG') next.bold = true
    if (tag === 'I' || tag === 'EM') next.italic = true
    if (tag === 'U') next.underline = true
    // Some browsers express formatting as inline CSS instead of tags.
    const weight = node.style?.fontWeight
    if (weight === 'bold' || Number(weight) >= 600) next.bold = true
    if (node.style?.fontStyle === 'italic') next.italic = true
    if ((node.style?.textDecorationLine || node.style?.textDecoration || '').includes('underline')) {
      next.underline = true
    }

    const isBlock = tag === 'DIV' || tag === 'P'
    if (isBlock && currentLine().length > 0) startNewLine()
    node.childNodes.forEach((child) => walk(child, next))
    if (isBlock && currentLine().length > 0) startNewLine()
  }

  root.childNodes.forEach((child) => walk(child, {}))

  while (lines.length > 0 && currentLine().every((run) => !run.text.trim())) {
    if (lines.length === 1) break
    lines.pop()
  }
  return lines
}

// The text of a document file as formatted lines. Older/seed files only have
// plain `content`, so those are converted on the fly.
function documentLines(node) {
  return node.lines ?? plainLines(node.content ?? '')
}

// Rich-text editor for document files. Bold/italic/underline apply to the
// selected text (or to what you type next), like Word. The browser owns the
// editable DOM while you type; every change is read back into plain `lines`
// data (see serializeEditor), so nothing is ever stored or rendered as HTML.
function DocumentEditor({ lines, align, onChange, onFormatsChange }) {
  const editorRef = useRef(null)
  const initialLines = useRef(lines)

  // Build the starting DOM once per file (the editor is keyed by file id).
  useEffect(() => {
    const root = editorRef.current
    if (!root) return
    root.textContent = ''
    initialLines.current.forEach((runs) => {
      const row = document.createElement('div')
      runs.forEach((run) => {
        if (!run.text) return
        let node = document.createTextNode(run.text)
        if (run.underline) {
          const wrap = document.createElement('u')
          wrap.appendChild(node)
          node = wrap
        }
        if (run.italic) {
          const wrap = document.createElement('em')
          wrap.appendChild(node)
          node = wrap
        }
        if (run.bold) {
          const wrap = document.createElement('strong')
          wrap.appendChild(node)
          node = wrap
        }
        row.appendChild(node)
      })
      if (!row.firstChild) row.appendChild(document.createElement('br'))
      root.appendChild(row)
    })
  }, [])

  // Keep the ribbon's B / I / U highlighting in step with the cursor.
  useEffect(() => {
    function handleSelectionChange() {
      const selection = document.getSelection()
      if (!selection || !editorRef.current?.contains(selection.anchorNode)) return
      onFormatsChange({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
      })
    }
    document.addEventListener('selectionchange', handleSelectionChange)
    return () => document.removeEventListener('selectionchange', handleSelectionChange)
  }, [onFormatsChange])

  function handleInput() {
    onChange(serializeEditor(editorRef.current))
  }

  // Paste as plain text so outside formatting can't sneak into the file.
  function handlePaste(event) {
    event.preventDefault()
    const text = event.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
  }

  return (
    <div
      ref={editorRef}
      className="workspace-doc-editor"
      style={{ textAlign: align }}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      aria-label="Document text"
      onInput={handleInput}
      onPaste={handlePaste}
    />
  )
}

function linesHaveText(lines) {
  return lines.some((runs) => runs.some((run) => run.text.trim()))
}

function renderRichLines(lines) {
  return lines.map((runs, lineIndex) => (
    <p key={lineIndex} className="workspace-post-line">
      {runs.length === 0 ? (
        <br />
      ) : (
        runs.map((run, runIndex) => {
          // Real strong/em/u elements (styled in the CSS) so the formatting
          // is visible and also meaningful to screen readers.
          let content = run.text
          if (run.underline) content = <u>{content}</u>
          if (run.italic) content = <em>{content}</em>
          if (run.bold) content = <strong>{content}</strong>
          return <span key={runIndex}>{content}</span>
        })
      )}
    </p>
  ))
}

const AVATAR_COLORS = ['#4a8f5c', '#1b3a5c', '#c0392b', '#d9822b', '#5c2d91', '#007acc']

function colorForName(name) {
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) % 997
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

// Profile picture if the user has one, otherwise a colored initials circle.
function renderAvatar(name, avatarUrl, extraClass = '') {
  const className = 'workspace-feed-avatar' + (extraClass ? ` ${extraClass}` : '')
  if (avatarUrl) {
    return <img className={className + ' workspace-feed-avatar--img'} src={avatarUrl} alt="" />
  }
  return (
    <span className={className} style={{ background: colorForName(name) }} aria-hidden="true">
      {getInitials(name)}
    </span>
  )
}

// Feed timestamps can be missing or invalid (bad data, older entries), so
// everything that reads them goes through these helpers.
function toValidDate(timestamp) {
  if (timestamp === null || timestamp === undefined || timestamp === '') return null
  const date = new Date(timestamp)
  return Number.isNaN(date.getTime()) ? null : date
}

// Newest first; entries without a usable time go last.
function sortByNewest(items) {
  const time = (item) => toValidDate(item.timestamp)?.getTime() ?? -Infinity
  return [...items].sort((a, b) => time(b) - time(a))
}

function formatFeedTime(timestamp) {
  const date = toValidDate(timestamp)
  if (!date) return 'Date unavailable'
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function feedTimeAttr(timestamp) {
  return toValidDate(timestamp)?.toISOString()
}

// Match saved Workspace file categories to their existing folders.
const WORKSPACE_FOLDER_IDS = {
  Documents: 'folder-docs',
  Spreadsheets: 'folder-sheets',
  Presentations: 'folder-slides',
  Database: 'folder-db',
  Source: 'folder-src',
}

// Default folder for each Workspace editor file type.
const DEFAULT_FILE_FOLDERS = {
  document: WORKSPACE_FOLDER_IDS.Documents,
  spreadsheet: WORKSPACE_FOLDER_IDS.Spreadsheets,
  presentation: WORKSPACE_FOLDER_IDS.Presentations,
  sql: WORKSPACE_FOLDER_IDS.Database,
  code: WORKSPACE_FOLDER_IDS.Source,
}

// Match saved resource types to editor file types.
const WORKSPACE_FILE_TYPES = {
  workspace_document: 'document',
  workspace_spreadsheet: 'spreadsheet',
  workspace_presentation: 'presentation',
  workspace_sql: 'sql',
  workspace_code: 'code',
}

// ---------- Tree helpers (immutable) ----------

function findNode(nodes, id) {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.type === 'folder' && node.children) {
      const found = findNode(node.children, id)
      if (found) return found
    }
  }
  return null
}

function updateNode(nodes, id, updater) {
  return nodes.map((node) => {
    if (node.id === id) return updater(node)
    if (node.type === 'folder' && node.children) {
      return { ...node, children: updateNode(node.children, id, updater) }
    }
    return node
  })
}

function insertNode(nodes, folderId, newNode) {
  if (folderId === 'ROOT') return [...nodes, newNode]
  return nodes.map((node) => {
    if (node.id === folderId && node.type === 'folder') {
      return { ...node, children: [...(node.children ?? []), newNode] }
    }
    if (node.type === 'folder' && node.children) {
      return { ...node, children: insertNode(node.children, folderId, newNode) }
    }
    return node
  })
}

// Create the five standard folders and place saved files inside them.
function buildWorkspaceTree(files) {
  const tree = INITIAL_TREE.map((folder) => ({
    ...folder,
    children: [],
  }))

  for (const file of files) {
    const type = WORKSPACE_FILE_TYPES[file.resource_type]
    const folderId = WORKSPACE_FOLDER_IDS[file.category]

    // Ignore unsupported file types or categories.
    if (!type || !folderId) continue

    const node = {
      ...(file.content && typeof file.content === 'object' ? file.content : {}),
      id: `workspace-${file.resource_id}`,
      resourceId: file.resource_id,
      name: file.resource_name,
      type,
      revision: 0,
      dirty: false,
    }

    const folder = tree.find((item) => item.id === folderId)
    if (folder) {
      folder.children.push(node)
    }
  }

  return tree
}

// Every file in the tree (folders excluded), each with the name of the
// folder it lives in — used by the composer's "link files" picker.
function flattenFiles(nodes, folderName = '') {
  const files = []
  for (const node of nodes) {
    if (node.type === 'folder') {
      files.push(...flattenFiles(node.children ?? [], node.name))
    } else {
      files.push({ id: node.id, name: node.name, type: node.type, folder: folderName })
    }
  }
  return files
}

function countFilesOfType(nodes, type) {
  let count = 0
  for (const node of nodes) {
    if (node.type === type) count += 1
    if (node.type === 'folder' && node.children) count += countFilesOfType(node.children, type)
  }
  return count
}

function buildEmptyFileNode(type, name) {
  const id = nextId()
  switch (type) {
    case 'document':
      return { id, name, type, content: '', bold: false, italic: false, underline: false, align: 'left' }
    case 'spreadsheet':
      return { id, name, type, cells: {}, formats: {} }
    case 'presentation':
      return {
        id,
        name,
        type,
        slides: [{ id: nextId(), title: 'New slide', body: '' }],
        activeSlideIndex: 0,
      }
    case 'sql':
      return { id, name, type, content: '-- New query\n' }
    case 'code':
      return { id, name, type, content: '' }
    default:
      return { id, name, type, content: '' }
  }
}

function Workspace() {
  const {
    projects,
    activeProject,
    setActiveProject,
    loadingProjects,
    projectError,
    // Not implemented on the backend/provider yet — this is a placeholder
    // contract for the backend dev to fill in: createProject({ project_name,
    // description }) should create the project, add it to `projects`, and
    // set it as the active project (see handleCreateProject below for the
    // exact shape this file calls it with). Until then this is undefined and
    // the "New Project..." form shows a friendly error instead of crashing.
    createProject,
  } = useProject()

  // All hooks run unconditionally, before the loading/error/empty guard
  // clauses below. The file tree itself isn't backed by a project-scoped
  // endpoint yet, so it's seeded once here.
  const [tree, setTree] = useState(INITIAL_TREE)
  const [savingFile, setSavingFile] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [expandedFolders, setExpandedFolders] = useState(
    () => new Set(['folder-docs', 'folder-sheets', 'folder-slides', 'folder-db', 'folder-src'])
  )
  // No file is selected on load, so the feed is the landing screen.
  const [selectedId, setSelectedId] = useState(null)
  // Share filename editing state between the file tree and Workspace toolbar.
  const [renamingFileId, setRenamingFileId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [renameSource, setRenameSource] = useState(null)
  // Keep filename validation feedback separate from general Workspace save errors.
  const [renameError, setRenameError] = useState('')
  // Prevent overlapping rename submissions from keyboard and blur events.
  const renameSubmittingRef = useRef(false)
  // Track intentional cancellation so blur does not save the filename.
  const renameCancelRef = useRef(false)
  const [newFileMenuOpen, setNewFileMenuOpen] = useState(false)
  // Reference the New File menu for outside-click dismissal.
  const newFileMenuRef = useRef(null)
  // Close the New File menu when clicking outside or pressing Escape.
  useEffect(() => {
    if (!newFileMenuOpen) return

    function handleOutsideClick(event) {
      if (
        newFileMenuRef.current &&
        !newFileMenuRef.current.contains(event.target)
      ) {
        setNewFileMenuOpen(false)
      }
    }

    function handleEscapeKey(event) {
      if (event.key === 'Escape') {
        setNewFileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleEscapeKey)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [newFileMenuOpen])
  const [activeCell, setActiveCell] = useState('A1')
  const [activeRibbonTab, setActiveRibbonTab] = useState('Home')
  const [explorerOpen, setExplorerOpen] = useState(true)
  const [feedOpen, setFeedOpen] = useState(false)
  const [feedView, setFeedView] = useState('posts')
  const [posts, setPosts] = useState(INITIAL_POSTS)
  const [changes, setChanges] = useState(INITIAL_CHANGES)
  const [composerOpen, setComposerOpen] = useState(false)
  // Save prompt: asks whether a save should also become a post. "Don't ask
  // again" is remembered in this browser only.
  const [savePromptOpen, setSavePromptOpen] = useState(false)
  const [savePromptSkip, setSavePromptSkip] = useState(false)
  const [savedFileId, setSavedFileId] = useState(null)
  // Read from localStorage when the page loads, so changing it on the Settings
  // page takes effect next time Workspace opens.
  const [skipSavePrompt, setSkipSavePrompt] = useState(() => {
    try {
      return localStorage.getItem('mosalinx.skipSavePrompt') === '1'
    } catch {
      return false
    }
  })
  const [composerEmpty, setComposerEmpty] = useState(true)
  // Bold/italic/underline state at the cursor in the open document.
  const [docFormats, setDocFormats] = useState({ bold: false, italic: false, underline: false })
  const [composerFormats, setComposerFormats] = useState({ bold: false, italic: false, underline: false })
  const [composerImages, setComposerImages] = useState([])
  const [composerFileIds, setComposerFileIds] = useState([])
  const [composerPickerOpen, setComposerPickerOpen] = useState(false)
  const [composerError, setComposerError] = useState('')
  const composerEditorRef = useRef(null)
  const composerImageInputRef = useRef(null)

  // Put the cursor in the editor as soon as the composer opens.
  useEffect(() => {
    if (composerOpen) composerEditorRef.current?.focus()
  }, [composerOpen])
  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')
  const [creatingProject, setCreatingProject] = useState(false)
  const [createProjectError, setCreateProjectError] = useState('')
  // Load saved Workspace files whenever the active project changes.
  useEffect(() => {
    let cancelled = false

    async function loadProjectFiles() {
      const projectId = activeProject?.project_id
      const user = auth.currentUser

      // Clear the previous project's files before loading the next project.
      setSelectedId(null)
      setTree(buildWorkspaceTree([]))
      setSaveError('')

      if (!projectId || !user) {
        setTree(INITIAL_TREE)
        return
      }

      try {
        const result = await listWorkspaceFiles(user, projectId)
        const savedFiles = await Promise.all(
          (result.files ?? []).map(async (file) => {
            const details = await getWorkspaceFile(user, file.resource_id)
            return {
              ...file,
              ...(details.file ?? {}),
            }
          })
        )

        if (!cancelled) {
          setTree(buildWorkspaceTree(savedFiles))
        }
      } catch (error) {
        if (!cancelled) {
          setSaveError(error.message || 'Unable to load Workspace files.')
          setTree(buildWorkspaceTree([]))
        }
      }
    }

    loadProjectFiles()

    return () => {
      cancelled = true
    }
  }, [activeProject?.project_id])

  // Prevent project changes from interrupting saves or silently losing edits.
  const handleProjectChange = (event) => {
    if (savingFile) return

    const selectedProject = projects.find(
      (project) => String(project.project_id) === event.target.value
    )

    if (!selectedProject || selectedProject.project_id === activeProject?.project_id) {
      return
    }

    const hasUnsavedFiles = flattenFiles(tree).some(
      (file) => findNode(tree, file.id)?.dirty
    )

    if (hasUnsavedFiles) {
      const confirmed = window.confirm(
        'You have unsaved Workspace files. Switching projects will discard those changes. Continue?'
      )

      if (!confirmed) return
    }

    setActiveProject(selectedProject)
  }

  function openNewProjectModal() {
    setNewProjectName('')
    setNewProjectDescription('')
    setCreateProjectError('')
    setNewProjectModalOpen(true)
  }

  function closeNewProjectModal() {
    if (creatingProject) return
    setNewProjectModalOpen(false)
  }

  async function handleCreateProject(event) {
    event.preventDefault()

    if (!newProjectName.trim()) {
      setCreateProjectError('Please enter a project name.')
      return
    }

    if (!createProject) {
      // Backend dev: wire up ProjectProvider's createProject and this will
      // start working with no changes needed here.
      setCreateProjectError('Project creation isn’t connected to the backend yet.')
      return
    }

    setCreatingProject(true)
    setCreateProjectError('')
    try {
      await createProject({
        project_name: newProjectName.trim(),
        description: newProjectDescription.trim(),
      })
      setNewProjectModalOpen(false)
    } catch (error) {
      setCreateProjectError(error.message || 'Failed to create project.')
    } finally {
      setCreatingProject(false)
    }
  }

  const selectedNode = selectedId ? findNode(tree, selectedId) : null

  function toggleFolder(id) {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Start renaming from either the file tree or toolbar, protecting the extension.
  function startRenamingFile(node, source = 'tree') {
    if (savingFile) return

    // Clear any cancellation from a previous rename attempt.
    renameCancelRef.current = false

    const extension = FILE_TYPES[node.type]?.extension ?? ''
    const baseName = node.name.endsWith(extension)
      ? node.name.slice(0, -extension.length)
      : node.name

    setRenamingFileId(node.id)
    setRenameValue(baseName)
    setRenameSource(source)
    setRenameError('')
    setSaveError('')
  }

  // Rename a file using the existing API while preserving unsaved editor changes.
  async function confirmRenameFile(node) {
    // Ignore duplicate submissions while a rename request is in progress.
    if (renameSubmittingRef.current) return
    renameSubmittingRef.current = true
    try {

      const baseName = renameValue.trim()
      const extension = FILE_TYPES[node.type]?.extension ?? ''

      if (!baseName) {
        setRenameError('Please enter a filename.')
        return
      }

      const newName = `${baseName}${extension}`

      if (newName === node.name) {
        setRenamingFileId(null)
        setRenameValue('')
        setRenameSource(null)
        return
      }

      const resourceId = node.resourceId ?? node.resource_id

      if (resourceId) {
        const user = auth.currentUser

        if (!user) {
          setRenameError('Please sign in before renaming this file.')
          return
        }

        try {
          setSavingFile(true)
          setSaveError('')

          // Update filename metadata without rewriting Firebase Storage content.
          await renameWorkspaceFile(user, resourceId, newName)
        } catch (error) {
          setRenameError(error.message || 'Unable to rename this file.')
          return
        } finally {
          setSavingFile(false)
        }
      }

      // Preserve the current dirty state for saved files with unsaved edits.
      setTree((prev) =>
        updateNode(prev, node.id, (current) => ({
          ...current,
          name: newName,
          dirty: resourceId ? current.dirty : true,
          revision: (current.revision ?? 0) + 1,
        }))
      )

      setRenamingFileId(null)
      setRenameValue('')
      setRenameSource(null)
    } finally {
      renameSubmittingRef.current = false
    }
  }

  function selectNode(id) {
    setSelectedId(id)
    setActiveCell('A1')
    setNewFileMenuOpen(false)
    setActiveRibbonTab('Home')
    // Picking a file always brings it to the front, even if the feed was
    // open over the previous one.
    setFeedOpen(false)
  }

  // Apply editor changes and track revisions for safe persistence.
  // View-only updates do not mark the file as unsaved.
  function updateSelectedFile(updater, markDirty = true) {
    if (!selectedId) return

    setTree((prev) =>
      updateNode(prev, selectedId, (node) => {
        const changes = updater(node)
        if (Object.keys(changes).length === 0) return node

        return {
          ...node,
          ...changes,
          ...(markDirty
            ? {
              dirty: true,
              revision: (node.revision ?? 0) + 1,
            }
            : {}),
        }
      })
    )
  }

  // Save the selected file to the backend before showing the save prompt.
  async function handleSave() {
    if (!selectedNode?.dirty || savingFile) return

    const fileId = selectedNode.id
    const saved = await commitSave()

    // Do not show the prompt if saving failed.
    if (!saved) return

    if (skipSavePrompt) return

    setSavedFileId(fileId)
    setSavePromptSkip(false)
    setSavePromptOpen(true)
  }

  // Persist the file and clear its unsaved flag only after success.
  async function commitSave() {
    if (!selectedNode?.dirty || savingFile) return false

    setSavingFile(true)
    setSaveError('')

    try {
      // Capture the submitted version so newer edits remain unsaved.
      const savingRevision = selectedNode.revision ?? 0
      const user = auth.currentUser
      const projectId = activeProject?.project_id

      if (!user) {
        throw new Error('Please sign in before saving this file.')
      }

      if (!projectId) {
        throw new Error('Please select a project before saving this file.')
      }

      let response

      // Use the database ID for saved files, not the local Workspace ID.
      const existingResourceId =
        selectedNode.resourceId ?? selectedNode.resource_id

      if (existingResourceId) {
        response = await updateWorkspaceFile(
          user,
          existingResourceId,
          selectedNode
        )
      } else {
        response = await createWorkspaceFile(
          user,
          projectId,
          selectedNode
        )
      }

      const resourceId =
        response.file?.resource_id ??
        response.file?.resourceId ??
        response.file?.id ??
        existingResourceId

      if (!resourceId) {
        throw new Error('The saved file did not return a database ID.')
      }

      const userName =
        user.displayName || user.email || 'You'

      setTree((prev) =>
        updateNode(prev, selectedNode.id, (node) => ({
          ...node,
          resourceId,
          dirty: (node.revision ?? 0) !== savingRevision,
        }))
      )

      setChanges((prev) => [
        {
          id: nextId(),
          projectId,
          action: 'modified',
          user: userName,
          fileId: selectedNode.id,
          fileName: selectedNode.name,
          timestamp: Date.now(),
        },
        ...prev,
      ])

      return true
    } catch (error) {
      setSaveError(error.message || 'Unable to save this file. Please try again.')
      return false
    } finally {
      setSavingFile(false)
    }
  }

  // "Don't ask me again" counts whichever button is clicked. Switch it back
  // on from the Settings page.
  function rememberSavePromptChoice() {
    if (!savePromptSkip) return
    setSkipSavePrompt(true)
    try {
      localStorage.setItem('mosalinx.skipSavePrompt', '1')
    } catch {
      // storage unavailable: the choice just lasts until reload
    }
  }

  // Dismiss the save prompt without opening the post composer.
  function closeSavePrompt() {
    rememberSavePromptChoice()
    setSavePromptOpen(false)
  }

  // Return to File: just closes the prompt (the save already happened).
  function handleReturnToFile() {
    rememberSavePromptChoice()
    setSavePromptOpen(false)
  }

  // Opens the composer with the saved file already linked.
  function handleMakePost() {
    rememberSavePromptChoice()
    setSavePromptOpen(false)
    openComposer()
    if (savedFileId) setComposerFileIds([savedFileId])
  }

  // ---------- Post composer ----------

  function openComposer() {
    setComposerEmpty(true)
    setComposerFormats({ bold: false, italic: false, underline: false })
    setComposerImages([])
    setComposerFileIds([])
    setComposerPickerOpen(false)
    setComposerError('')
    setComposerOpen(true)
  }

  function closeComposer() {
    // Images that never made it into a post don't need to stay in memory.
    composerImages.forEach((image) => URL.revokeObjectURL(image.url))
    setComposerImages([])
    setComposerOpen(false)
  }

  function refreshComposerFormats() {
    setComposerFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
    })
  }

  // Toolbar buttons use onMouseDown + preventDefault so clicking them
  // doesn't steal focus or collapse the text selection first.
  function applyComposerFormat(event, command) {
    event.preventDefault()
    composerEditorRef.current?.focus()
    document.execCommand(command)
    refreshComposerFormats()
  }

  function handleComposerInput() {
    const editor = composerEditorRef.current
    setComposerEmpty(!editor || editor.innerText.trim() === '')
    setComposerError('')
  }

  // Paste as plain text so outside formatting can't sneak into the post.
  function handleComposerPaste(event) {
    event.preventDefault()
    const text = event.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
  }

  function handleComposerImages(event) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (files.length === 0) return

    const accepted = []
    let problem = ''
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        problem = `${file.name} isn’t an image.`
      } else if (file.size > MAX_IMAGE_BYTES) {
        problem = `${file.name} is larger than 5 MB.`
      } else if (composerImages.length + accepted.length >= MAX_POST_IMAGES) {
        problem = `You can attach up to ${MAX_POST_IMAGES} images.`
      } else {
        accepted.push({ id: nextId(), name: file.name, url: URL.createObjectURL(file) })
      }
    }

    if (accepted.length > 0) setComposerImages((prev) => [...prev, ...accepted])
    setComposerError(problem)
  }

  function removeComposerImage(id) {
    setComposerImages((prev) => {
      const removed = prev.find((image) => image.id === id)
      if (removed) URL.revokeObjectURL(removed.url)
      return prev.filter((image) => image.id !== id)
    })
  }

  function toggleComposerFile(id) {
    setComposerFileIds((prev) => (prev.includes(id) ? prev.filter((fileId) => fileId !== id) : [...prev, id]))
  }

  function handlePublishPost(event) {
    event.preventDefault()
    const editor = composerEditorRef.current
    if (!editor) return

    const lines = serializeEditor(editor)
    const hasText = linesHaveText(lines)
    if (!hasText && composerImages.length === 0 && composerFileIds.length === 0) {
      setComposerError('Write something, or attach an image or a file, before posting.')
      return
    }

    const currentUser = auth.currentUser
    const allFiles = flattenFiles(tree)
    const linkedFiles = composerFileIds
      .map((id) => allFiles.find((file) => file.id === id))
      .filter(Boolean)
      .map((file) => ({ id: file.id, name: file.name }))

    setPosts((prev) => [
      {
        id: nextId(),
        projectId: activeProject?.project_id ?? null,
        user: currentUser?.displayName || currentUser?.email || 'You',
        avatarUrl: currentUser?.photoURL || null,
        lines: hasText ? lines : [],
        images: composerImages,
        files: linkedFiles,
        timestamp: Date.now(),
      },
      ...prev,
    ])

    // The images now belong to the post, so don't revoke them here.
    setComposerImages([])
    setComposerOpen(false)
    setFeedView('posts')
    setFeedOpen(true)
  }

  function createNewFile(type) {
    const typeInfo = FILE_TYPES[type]
    const count = countFilesOfType(tree, type) + 1
    const baseName = `Untitled ${typeInfo.label} ${count}`
    const name = type === 'code' ? `${baseName}.js` : `${baseName}${typeInfo.extension}`

    // New files start unsaved; revision tracks subsequent edits.
    const newNode = {
      ...buildEmptyFileNode(type, name),
      revision: 0,
      dirty: true,
    }

    // Place new files in their designated category folders,
    // regardless of which file was previously selected.
    const targetFolder = DEFAULT_FILE_FOLDERS[type] ?? 'ROOT'

    setTree((prev) => insertNode(prev, targetFolder, newNode))
    setChanges((prev) => [
      {
        id: nextId(),
        projectId: activeProject?.project_id ?? null,
        action: 'created',
        user: auth.currentUser?.displayName || auth.currentUser?.email || 'You',
        fileId: newNode.id,
        fileName: newNode.name,
        timestamp: Date.now(),
      },
      ...prev,
    ])
    if (targetFolder !== 'ROOT') {
      setExpandedFolders((prev) => new Set(prev).add(targetFolder))
    }
    setSelectedId(newNode.id)
    setActiveCell('A1')
    setNewFileMenuOpen(false)
    setActiveRibbonTab('Home')
    setFeedOpen(false)
  }

  // ---------- Ribbon tool actions ----------

  // Applies to the selected text in the document. onMouseDown + preventDefault
  // keeps the selection from being lost when the ribbon button is clicked.
  function applyDocFormat(event, command) {
    event.preventDefault()
    document.execCommand(command)
    setDocFormats((prev) => ({ ...prev, [command]: document.queryCommandState(command) }))
  }

  function setDocumentLines(lines) {
    const content = lines.map((runs) => runs.map((run) => run.text).join('')).join('\n')
    updateSelectedFile(() => ({ lines, content }))
  }

  function setDocAlign(align) {
    updateSelectedFile(() => ({ align }))
  }

  function toggleCellFormat(key) {
    updateSelectedFile((node) => {
      const current = node.formats?.[activeCell] ?? {}
      return {
        formats: {
          ...node.formats,
          [activeCell]: { ...current, [key]: !current[key] },
        },
      }
    })
  }

  function setCellValue(cellKey, value) {
    updateSelectedFile((node) => ({ cells: { ...node.cells, [cellKey]: value } }))
  }

  function addSlide() {
    updateSelectedFile((node) => {
      const slides = [...node.slides, { id: nextId(), title: 'New slide', body: '' }]
      return { slides, activeSlideIndex: slides.length - 1 }
    })
  }

  function duplicateSlide() {
    updateSelectedFile((node) => {
      const current = node.slides[node.activeSlideIndex]
      const copy = { ...current, id: nextId() }
      const slides = [...node.slides]
      slides.splice(node.activeSlideIndex + 1, 0, copy)
      return { slides, activeSlideIndex: node.activeSlideIndex + 1 }
    })
  }

  function deleteSlide() {
    updateSelectedFile((node) => {
      if (node.slides.length <= 1) return {}
      const slides = node.slides.filter((_, idx) => idx !== node.activeSlideIndex)
      const activeSlideIndex = Math.min(node.activeSlideIndex, slides.length - 1)
      return { slides, activeSlideIndex }
    })
  }

  function setActiveSlideIndex(idx) {
    updateSelectedFile(() => ({ activeSlideIndex: idx }), false)
  }

  function updateSlideField(field, value) {
    updateSelectedFile((node) => {
      const slides = node.slides.map((slide, idx) =>
        idx === node.activeSlideIndex ? { ...slide, [field]: value } : slide
      )
      return { slides }
    })
  }

  // ---------- Render helpers ----------

  function renderTree(nodes, depth) {
    return nodes.map((node) => {
      if (node.type === 'folder') {
        const isExpanded = expandedFolders.has(node.id)
        const isSelected = selectedId === node.id
        return (
          <div key={node.id}>
            <button
              type="button"
              className={'workspace-tree-row' + (isSelected ? ' is-selected' : '')}
              style={{ paddingLeft: 10 + depth * 16 }}
              onClick={() => {
                toggleFolder(node.id)
                selectNode(node.id)
              }}
            >
              <span className={'workspace-tree-chevron' + (isExpanded ? ' is-open' : '')}>
                {ICONS.chevron}
              </span>
              <span className="workspace-tree-icon">{isExpanded ? ICONS.folderOpen : ICONS.folder}</span>
              <span className="workspace-tree-label">{node.name}</span>
            </button>
            {isExpanded && node.children && renderTree(node.children, depth + 1)}
          </div>
        )
      }

      const isSelected = selectedId === node.id
      const typeInfo = FILE_TYPES[node.type]
      const isRenaming = renamingFileId === node.id && renameSource === 'tree'

      if (isRenaming) {
        return (
          <div
            key={node.id}
            className="workspace-tree-row workspace-tree-row--file is-selected"
            style={{ paddingLeft: 10 + depth * 16 + 16 }}
          >
            <span className="workspace-tree-icon">
              {typeInfo?.icon ?? ICONS.document}
            </span>
            <input
              className="workspace-tree-rename-input"
              type="text"
              aria-label={`Rename ${node.name}`}
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  confirmRenameFile(node)
                } else if (event.key === 'Escape') {
                  event.preventDefault()
                  setRenamingFileId(null)
                  setRenameValue('')
                  setRenameSource(null)
                }
              }}
              autoFocus
            />
            <span>{typeInfo?.extension}</span>
          </div>
        )
      }

      return (
        <button
          key={node.id}
          type="button"
          className={
            'workspace-tree-row workspace-tree-row--file' +
            (isSelected ? ' is-selected' : '')
          }
          style={{ paddingLeft: 10 + depth * 16 + 16 }}
          onClick={() => selectNode(node.id)}
          onKeyDown={(event) => {
            if (event.key === 'F2') {
              event.preventDefault()
              startRenamingFile(node)
            }
          }}
          onContextMenu={(event) => {
            event.preventDefault()
            selectNode(node.id)
            startRenamingFile(node)
          }}
        >
          <span className="workspace-tree-icon">
            {typeInfo?.icon ?? ICONS.document}
          </span>
          <span className="workspace-tree-label">{node.name}</span>
          {node.dirty && (
            <span
              className="workspace-tree-unsaved"
              title="Unsaved changes"
              aria-label="Unsaved changes"
            />
          )}
          {node.viewers?.length > 0 && (
            <span className="workspace-tree-dot" aria-hidden="true" />
          )}
        </button>

      )
    })
  }

  // A ribbon "group" is Office's unit of organization: a cluster of related
  // buttons with a small caption underneath (e.g. "Font", "Paragraph",
  // "Clipboard"). Most groups below mix real, wired-up controls (Bold/Align,
  // cell formatting, slide management, Run) with purely decorative ones
  // (Paste/Cut/Copy, font-name pickers, style galleries) that exist to sell
  // the authentic Office look — those are plain buttons with no onClick, so
  // they're visually present but inert rather than faking functionality.

  function RibbonButton({ active, big, onClick, children, ...rest }) {
    return (
      <button
        type="button"
        className={
          'workspace-ribbon-btn' + (big ? ' workspace-ribbon-btn--big' : '') + (active ? ' is-active' : '')
        }
        onClick={onClick}
        {...rest}
      >
        {children}
      </button>
    )
  }

  function RibbonGroup({ caption, children }) {
    return (
      <div className="workspace-ribbon-group">
        <div className="workspace-ribbon-group-buttons">{children}</div>
        <span className="workspace-ribbon-group-caption">{caption}</span>
      </div>
    )
  }

  function ClipboardGroup() {
    return (
      <RibbonGroup caption="Clipboard">
        <RibbonButton big>📋 Paste</RibbonButton>
        <div className="workspace-ribbon-btn-stack">
          <RibbonButton>✂ Cut</RibbonButton>
          <RibbonButton>⧉ Copy</RibbonButton>
        </div>
      </RibbonGroup>
    )
  }

  // When the ribbon is disabled (no file selected, or a folder is
  // selected) there's no real node to read formatting state from — this
  // stands in so the Word/document groups can still render their inert
  // placeholder state instead of crashing on selectedNode.bold etc.
  const DISABLED_NODE_STATE = { bold: false, italic: false, underline: false, align: 'left', formats: {}, cells: {} }

  function renderHomeGroups() {
    const node = hasFile ? selectedNode : DISABLED_NODE_STATE
    switch (effectiveType) {
      case 'document':
        return (
          <>
            <ClipboardGroup />
            <RibbonGroup caption="Font">
              <select className="workspace-ribbon-select" defaultValue="Calibri">
                <option>Calibri</option>
                <option>Arial</option>
                <option>Times New Roman</option>
              </select>
              <select className="workspace-ribbon-select workspace-ribbon-select--narrow" defaultValue="11">
                <option>9</option>
                <option>11</option>
                <option>14</option>
                <option>18</option>
              </select>
              <RibbonButton
                active={docFormats.bold}
                onMouseDown={(e) => applyDocFormat(e, 'bold')}
                aria-label="Bold"
                aria-pressed={docFormats.bold}
                title="Bold (Ctrl+B)"
              >
                <strong>B</strong>
              </RibbonButton>
              <RibbonButton
                active={docFormats.italic}
                onMouseDown={(e) => applyDocFormat(e, 'italic')}
                aria-label="Italic"
                aria-pressed={docFormats.italic}
                title="Italic (Ctrl+I)"
              >
                <em>I</em>
              </RibbonButton>
              <RibbonButton
                active={docFormats.underline}
                onMouseDown={(e) => applyDocFormat(e, 'underline')}
                aria-label="Underline"
                aria-pressed={docFormats.underline}
                title="Underline (Ctrl+U)"
              >
                <span style={{ textDecoration: 'underline' }}>U</span>
              </RibbonButton>
            </RibbonGroup>
            <RibbonGroup caption="Paragraph">
              {['left', 'center', 'right'].map((align) => (
                <RibbonButton
                  key={align}
                  active={node.align === align}
                  onClick={() => setDocAlign(align)}
                  aria-label={`Align ${align}`}
                >
                  {align === 'left' && '⟸'}
                  {align === 'center' && '≡'}
                  {align === 'right' && '⟹'}
                </RibbonButton>
              ))}
              <RibbonButton>• ≡</RibbonButton>
              <RibbonButton>1. ≡</RibbonButton>
            </RibbonGroup>
            <RibbonGroup caption="Styles">
              <RibbonButton big>Normal</RibbonButton>
              <RibbonButton big>Heading 1</RibbonButton>
              <RibbonButton big>Heading 2</RibbonButton>
            </RibbonGroup>
          </>
        )

      case 'spreadsheet': {
        const activeFormat = node.formats?.[activeCell] ?? {}
        return (
          <>
            <ClipboardGroup />
            <RibbonGroup caption="Font">
              <select className="workspace-ribbon-select" defaultValue="Calibri">
                <option>Calibri</option>
                <option>Arial</option>
              </select>
              <RibbonButton active={activeFormat.bold} onClick={() => toggleCellFormat('bold')}>
                <strong>B</strong>
              </RibbonButton>
              <RibbonButton active={activeFormat.italic} onClick={() => toggleCellFormat('italic')}>
                <em>I</em>
              </RibbonButton>
              <RibbonButton active={activeFormat.fill} onClick={() => toggleCellFormat('fill')}>
                🎨 Fill
              </RibbonButton>
            </RibbonGroup>
            <RibbonGroup caption="Alignment">
              <RibbonButton>⟸</RibbonButton>
              <RibbonButton>≡</RibbonButton>
              <RibbonButton>⟹</RibbonButton>
            </RibbonGroup>
            <RibbonGroup caption="Number">
              <select className="workspace-ribbon-select" defaultValue="General">
                <option>General</option>
                <option>Number</option>
                <option>Currency</option>
                <option>Percent</option>
              </select>
            </RibbonGroup>
            <RibbonGroup caption="Cells">
              <RibbonButton>Insert</RibbonButton>
              <RibbonButton>Delete</RibbonButton>
            </RibbonGroup>
            <RibbonGroup caption="Active cell">
              <span className="workspace-ribbon-label">{activeCell}</span>
            </RibbonGroup>
          </>
        )
      }

      case 'presentation':
        return (
          <>
            <ClipboardGroup />
            <RibbonGroup caption="Slides">
              <RibbonButton big onClick={addSlide}>
                {ICONS.plus} New Slide
              </RibbonButton>
              <div className="workspace-ribbon-btn-stack">
                <RibbonButton onClick={duplicateSlide}>Duplicate</RibbonButton>
                <RibbonButton onClick={deleteSlide}>Delete</RibbonButton>
              </div>
              <RibbonButton>Layout</RibbonButton>
            </RibbonGroup>
            <RibbonGroup caption="Font">
              <select className="workspace-ribbon-select" defaultValue="Calibri">
                <option>Calibri</option>
                <option>Arial</option>
              </select>
              <RibbonButton><strong>B</strong></RibbonButton>
              <RibbonButton><em>I</em></RibbonButton>
            </RibbonGroup>
            <RibbonGroup caption="Paragraph">
              <RibbonButton>⟸</RibbonButton>
              <RibbonButton>≡</RibbonButton>
              <RibbonButton>⟹</RibbonButton>
            </RibbonGroup>
            <RibbonGroup caption="Drawing">
              <RibbonButton>Shapes</RibbonButton>
              <RibbonButton>Arrange</RibbonButton>
            </RibbonGroup>
          </>
        )

      case 'sql':
        return (
          <>
            <RibbonGroup caption="Query">
              <RibbonButton big className="workspace-ribbon-btn--run">
                {ICONS.play} Run
              </RibbonButton>
              <RibbonButton>Stop</RibbonButton>
            </RibbonGroup>
            <RibbonGroup caption="Editor">
              <RibbonButton>Format Query</RibbonButton>
              <RibbonButton>Comment</RibbonButton>
            </RibbonGroup>
            <RibbonGroup caption="Connection">
              <span className="workspace-ribbon-label">Local Dev DB</span>
            </RibbonGroup>
          </>
        )

      case 'code':
        return (
          <>
            <RibbonGroup caption="Run">
              <RibbonButton big className="workspace-ribbon-btn--run">
                {ICONS.play} Run
              </RibbonButton>
            </RibbonGroup>
            <RibbonGroup caption="Editor">
              <RibbonButton>Format</RibbonButton>
              <RibbonButton>Word Wrap</RibbonButton>
            </RibbonGroup>
            <RibbonGroup caption="Language">
              <span className="workspace-ribbon-label">
                {selectedNode.name.split('.').pop()?.toUpperCase()}
              </span>
            </RibbonGroup>
          </>
        )

      default:
        return null
    }
  }

  function renderRibbonGroups() {
    if (activeRibbonTab !== 'Home') {
      return (
        <div className="workspace-ribbon-group workspace-ribbon-group--placeholder">
          <span className="workspace-ribbon-hint">Nothing here yet.</span>
        </div>
      )
    }
    return renderHomeGroups()
  }

  // A file name in the feed opens that file (if it still exists in the tree).
  function renderFeedFileLink(fileId, fileName) {
    const node = findNode(tree, fileId)
    if (!node) {
      return <span className="workspace-feed-file workspace-feed-file--gone">{fileName}</span>
    }
    return (
      <button type="button" className="workspace-feed-file" onClick={() => selectNode(node.id)}>
        <span className="workspace-feed-file-icon">{FILE_TYPES[node.type]?.icon ?? ICONS.document}</span>
        {fileName}
      </button>
    )
  }

  function renderFeed() {
    // Only this project's entries (the sample entries have no project, so
    // they show everywhere until real data exists).
    const inProject = (item) => !item.projectId || item.projectId === activeProject?.project_id
    const projectPosts = sortByNewest(posts.filter(inProject))
    const projectChanges = sortByNewest(changes.filter(inProject))

    return (
      <div className="workspace-feed">
        <div className="workspace-feed-header">
          <h2 className="workspace-feed-title">Project Feed</h2>
          <div className="workspace-feed-header-actions">
            <div className="workspace-feed-tabs" role="tablist" aria-label="Feed views" onKeyDown={handleFeedTabKeys}>
              <button
                type="button"
                role="tab"
                id="feed-tab-posts"
                aria-controls="feed-panel"
                tabIndex={feedView === 'posts' ? 0 : -1}
                aria-selected={feedView === 'posts'}
                className={'workspace-feed-tab' + (feedView === 'posts' ? ' is-active' : '')}
                onClick={() => setFeedView('posts')}
              >
                Posts
              </button>
              <button
                type="button"
                role="tab"
                id="feed-tab-activity"
                aria-controls="feed-panel"
                tabIndex={feedView === 'activity' ? 0 : -1}
                aria-selected={feedView === 'activity'}
                className={'workspace-feed-tab' + (feedView === 'activity' ? ' is-active' : '')}
                onClick={() => setFeedView('activity')}
              >
                Activity
              </button>
            </div>
            <button type="button" className="workspace-feed-new-post" onClick={openComposer}>
              {ICONS.plus} New Post
            </button>
          </div>
        </div>

        <div id="feed-panel" role="tabpanel" aria-labelledby={'feed-tab-' + feedView}>
          {feedView === 'posts' ? (
            projectPosts.length === 0 ? (
              <p className="workspace-feed-empty">No posts yet. Click New Post to share an update with your team.</p>
            ) : (
              <div className="workspace-feed-posts">
                {projectPosts.map((post) => (
                  <article key={post.id} className="workspace-feed-post">
                    <header className="workspace-feed-post-head">
                      {renderAvatar(post.user, post.avatarUrl)}
                      <div className="workspace-feed-post-meta">
                        <span className="workspace-feed-user">{post.user}</span>
                        <time className="workspace-feed-post-time" dateTime={feedTimeAttr(post.timestamp)}>
                          {formatFeedTime(post.timestamp)}
                        </time>
                      </div>
                    </header>

                    {post.lines.length > 0 && (
                      <div className="workspace-post-body">{renderRichLines(post.lines)}</div>
                    )}

                    {post.images.length > 0 && (
                      <div
                        className={'workspace-post-images' + (post.images.length === 1 ? ' is-single' : '')}
                      >
                        {post.images.map((image) => (
                          <img key={image.id} className="workspace-post-image" src={image.url} alt={image.name} />
                        ))}
                      </div>
                    )}

                    {post.files.length > 0 && (
                      <div className="workspace-post-files">
                        <span className="workspace-post-files-label">Linked files</span>
                        <ul className="workspace-post-files-list">
                          {post.files.map((file) => (
                            <li key={file.id}>{renderFeedFileLink(file.id, file.name)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )
          ) : projectChanges.length === 0 ? (
            <p className="workspace-feed-empty">No activity yet. Create or save a file to see it here.</p>
          ) : (
            <ul className="workspace-feed-changes">
              {projectChanges.map((change) => (
                <li key={change.id} className="workspace-feed-change">
                  <span className="workspace-feed-change-text">
                    <span className="workspace-feed-change-user">{change.user || 'Someone'}</span>
                    <span
                      className={
                        'workspace-feed-change-action workspace-feed-change-action--' +
                        (ACTIVITY_LABELS[change.action] ? change.action : 'modified')
                      }
                    >
                      {activityLabel(change.action)}
                    </span>
                    <span className="workspace-feed-change-file">
                      {renderFeedFileLink(change.fileId, change.fileName || 'Untitled file')}
                    </span>
                  </span>
                  <time className="workspace-feed-change-time" dateTime={feedTimeAttr(change.timestamp)}>
                    {formatFeedTime(change.timestamp)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    )
  }

  // Left/Right arrows move between the feed tabs.
  function handleFeedTabKeys(event) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const next = feedView === 'posts' ? 'activity' : 'posts'
    setFeedView(next)
    document.getElementById('feed-tab-' + next)?.focus()
  }

  function renderMainScreen() {
    if (!activeProject) {
      return (
        <div className="workspace-empty">
          <p>Create or select a project to start working with files.</p>
        </div>
      )
    }

    // The feed is the landing screen whenever no file is selected, and can
    // also be toggled open over the current file.
    if (feedVisible) {
      return renderFeed()
    }

    switch (selectedNode.type) {
      case 'document':
        return (
          <div className="workspace-doc-page">
            <DocumentEditor
              key={selectedNode.id}
              lines={documentLines(selectedNode)}
              align={selectedNode.align}
              onChange={setDocumentLines}
              onFormatsChange={setDocFormats}
            />
          </div>
        )

      case 'spreadsheet':
        return (
          <div className="workspace-sheet-wrap">
            <table className="workspace-sheet">
              <thead>
                <tr>
                  <th className="workspace-sheet-corner" />
                  {SPREADSHEET_COLUMNS.map((col) => (
                    <th key={col} className="workspace-sheet-colhead">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SPREADSHEET_ROWS.map((row) => (
                  <tr key={row}>
                    <th className="workspace-sheet-rowhead">{row}</th>
                    {SPREADSHEET_COLUMNS.map((col) => {
                      const key = `${col}${row}`
                      const format = selectedNode.formats?.[key] ?? {}
                      return (
                        <td key={key} className={key === activeCell ? 'is-active' : ''}>
                          <input
                            className="workspace-sheet-cell"
                            style={{
                              fontWeight: format.bold ? 700 : 400,
                              fontStyle: format.italic ? 'italic' : 'normal',
                              background: format.fill ? '#fdf3d0' : 'transparent',
                            }}
                            value={selectedNode.cells?.[key] ?? ''}
                            onFocus={() => setActiveCell(key)}
                            onChange={(e) => setCellValue(key, e.target.value)}
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )

      case 'presentation': {
        const activeSlide = selectedNode.slides[selectedNode.activeSlideIndex]
        return (
          <div className="workspace-slides-wrap">
            <div className="workspace-slides-list">
              {selectedNode.slides.map((slide, idx) => (
                <button
                  key={slide.id}
                  type="button"
                  className={
                    'workspace-slide-thumb' + (idx === selectedNode.activeSlideIndex ? ' is-active' : '')
                  }
                  onClick={() => setActiveSlideIndex(idx)}
                >
                  <span className="workspace-slide-thumb-number">{idx + 1}</span>
                  <span className="workspace-slide-thumb-title">{slide.title || 'Untitled'}</span>
                </button>
              ))}
            </div>
            <div className="workspace-slide-canvas">
              <input
                className="workspace-slide-title"
                value={activeSlide.title}
                placeholder="Slide title"
                onChange={(e) => updateSlideField('title', e.target.value)}
              />
              <textarea
                className="workspace-slide-body"
                value={activeSlide.body}
                placeholder="Slide content…"
                onChange={(e) => updateSlideField('body', e.target.value)}
              />
            </div>
          </div>
        )
      }

      case 'sql':
      case 'code':
        return (
          <div className="workspace-code-wrap">
            <div className="workspace-code-lines">
              {selectedNode.content.split('\n').map((_, idx) => (
                <span key={idx}>{idx + 1}</span>
              ))}
            </div>
            <textarea
              className="workspace-code-textarea"
              value={selectedNode.content}
              spellCheck={false}
              onChange={(e) => updateSelectedFile(() => ({ content: e.target.value }))}
            />
          </div>
        )

      default:
        return null
    }
  }

  const viewers = activeProject && selectedNode?.type !== 'folder' ? selectedNode?.viewers ?? [] : []

  // hasFile: a real file (not a folder) is selected in an active project.
  // The feed is shown whenever there's no file, or when the user has
  // toggled it open over the current one.
  const hasFile = !!activeProject && !!selectedNode && selectedNode.type !== 'folder'
  const feedVisible = !!activeProject && (!hasFile || feedOpen)

  // The ribbon is grayed out when there's no file to act on, or while the
  // feed covers the file. It keeps the selected file's theme in the latter
  // case; with no file it shows the Word (document) ribbon as a placeholder.
  const ribbonDisabled = !hasFile || feedOpen
  const effectiveType = hasFile && RIBBON_THEMES[selectedNode.type] ? selectedNode.type : 'document'
  const theme = RIBBON_THEMES[effectiveType]

  return (
    <div className="workspace-page">
      <div className="workspace-ribbon">
        {/* Outlook-style "compose" launchers: tall, always-enabled buttons
            pinned to the far left of the ribbon, outside the tab strip so
            they're never grayed out along with it. */}
        <div className="workspace-ribbon-launchers">
          <button
            type="button"
            className="workspace-ribbon-launch-btn workspace-ribbon-launch-btn--project"
            onClick={openNewProjectModal}
          >
            <span className="workspace-ribbon-launch-icon">{ICONS.plus}</span>
            <span className="workspace-ribbon-launch-label">New Project</span>
          </button>

          <div className="workspace-ribbon-new" ref={newFileMenuRef}>
            <button
              type="button"
              className="workspace-ribbon-launch-btn workspace-ribbon-launch-btn--file"
              onClick={() => setNewFileMenuOpen((open) => !open)}
              disabled={!activeProject}
              title={!activeProject ? 'Select or create a project first' : undefined}
            >
              <span className="workspace-ribbon-launch-icon">{ICONS.plus}</span>
              <span className="workspace-ribbon-launch-label">New File</span>
            </button>
            {newFileMenuOpen && (
              <div className="workspace-new-menu">
                {NEW_FILE_ORDER.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className="workspace-new-menu-item"
                    onClick={() => createNewFile(type)}
                  >
                    <span className="workspace-tree-icon">{FILE_TYPES[type].icon}</span>
                    {FILE_TYPES[type].label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="workspace-ribbon-main" style={{ '--ribbon-accent': theme.accent }}>
          {/* Project + file context lives right in the tab strip row now,
              alongside Home/Insert/Design/etc. it stays enabled even when
              the tabs/groups below are grayed out, since switching projects
              shouldn't require a file to be selected first. */}
          <div className="workspace-ribbon-tabstrip" role="tablist">
            <div className="workspace-ribbon-context">
              {loadingProjects ? (
                <span className="workspace-ribbon-context-status">Loading projects…</span>
              ) : projectError ? (
                <span className="workspace-ribbon-context-status workspace-ribbon-context-status--error" role="alert">
                  {projectError}
                </span>
              ) : projects.length === 0 ? (
                <span className="workspace-ribbon-context-status">No Active Project</span>
              ) : (
                <select
                  className="workspace-ribbon-context-select"
                  aria-label="Active project"
                  value={activeProject?.project_id || ''}
                  onChange={handleProjectChange}
                  disabled={savingFile}
                >
                  {projects.map((project) => (
                    <option key={project.project_id} value={project.project_id}>
                      {project.project_name}
                    </option>
                  ))}
                </select>
              )}

              {hasFile && (
                <>
                  <span className="workspace-ribbon-context-sep">/</span>

                  {renamingFileId === selectedNode.id && renameSource === 'toolbar' ? (
                    <>
                      <span className="workspace-ribbon-rename">
                        <input
                          className="workspace-ribbon-rename-input"
                          type="text"
                          aria-label={`Rename ${selectedNode.name}`}
                          value={renameValue}
                          onChange={(event) => setRenameValue(event.target.value)}
                          onBlur={() => {
                            if (renameCancelRef.current) {
                              renameCancelRef.current = false
                              return
                            }

                            if (!savingFile && !renameSubmittingRef.current) {
                              confirmRenameFile(selectedNode)
                            }
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault()
                              confirmRenameFile(selectedNode)
                            } else if (event.key === 'Escape') {
                              event.preventDefault()
                              renameCancelRef.current = true
                              setRenamingFileId(null)
                              setRenameValue('')
                              setRenameSource(null)
                            }
                          }}
                          autoFocus
                        />
                        <span>{FILE_TYPES[selectedNode.type]?.extension}</span>
                      </span>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="workspace-ribbon-context-file workspace-ribbon-rename-button"
                      onClick={() => startRenamingFile(selectedNode, 'toolbar')}
                      disabled={savingFile}
                      title="Click to rename file"
                      aria-label={`Rename ${selectedNode.name}`}
                    >
                      <span>{selectedNode.name}</span>
                      <span className="workspace-ribbon-rename-pencil" aria-hidden="true">
                        ✎
                      </span>
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="workspace-ribbon-tabdivider" />

            <div
              className={'workspace-ribbon-tabslist' + (ribbonDisabled ? ' is-disabled' : '')}
              aria-disabled={ribbonDisabled}
            >
              {theme.tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={activeRibbonTab === tab}
                  className={'workspace-ribbon-tab' + (activeRibbonTab === tab ? ' is-active' : '')}
                  onClick={() => !ribbonDisabled && setActiveRibbonTab(tab)}
                  tabIndex={ribbonDisabled ? -1 : 0}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Save + Feed stay enabled regardless of the grayed-out tabs. */}
            <div className="workspace-ribbon-actions">
              <button
                type="button"
                className="workspace-ribbon-pill workspace-ribbon-pill--primary"
                onClick={handleSave}
                disabled={!(hasFile && selectedNode.dirty) || savingFile}
                title={
                  savingFile
                    ? 'Saving file...'
                    : hasFile && selectedNode.dirty
                      ? 'Save changes'
                      : 'No unsaved changes'
                }
              >
                {savingFile ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                className="workspace-ribbon-pill"
                onClick={openComposer}
                disabled={!activeProject}
                title={activeProject ? 'Write a post for your team' : 'Select or create a project first'}
              >
                Post
              </button>
              <button
                type="button"
                className={'workspace-ribbon-pill' + (feedVisible ? ' is-active' : '')}
                onClick={() => setFeedOpen((open) => !open)}
                disabled={!hasFile}
                aria-pressed={feedVisible}
                title={hasFile ? (feedVisible ? 'Close feed' : 'Open feed') : 'Select a file to close the feed'}
              >
                Feed
              </button>
            </div>
            {saveError && (
              <p className="workspace-save-error" role="alert">
                {saveError}
              </p>
            )}

            <div className="workspace-ribbon-presence">
              {viewers.map((viewer) => (
                <span
                  key={viewer.name}
                  className="workspace-presence-avatar"
                  style={{ background: viewer.color }}
                  title={`${viewer.name} is viewing this file`}
                >
                  {viewer.name
                    .split(' ')
                    .map((part) => part[0])
                    .join('')}
                </span>
              ))}
            </div>
          </div>

          {renameSource === 'toolbar' && renameError && (
            <span className="workspace-ribbon-rename-error" role="alert">
              {renameError}
            </span>
          )}

          <div
            className={'workspace-ribbon-tools-wrap' + (ribbonDisabled ? ' is-disabled' : '')}
            aria-disabled={ribbonDisabled}
          >
            <div className="workspace-ribbon-tools">{renderRibbonGroups()}</div>
          </div>
        </div>
      </div>

      <div className="workspace-body">
        {/* Floating toggle anchored to a fixed spot in the top-left
            corner of the body, outside the explorer pane itself, so it
            never moves */}
        <button
          type="button"
          className="workspace-explorer-toggle"
          onClick={() => setExplorerOpen((open) => !open)}
          title={explorerOpen ? 'Hide file explorer' : 'Show file explorer'}
          aria-expanded={explorerOpen}
        >
          <span className={'workspace-explorer-toggle-icon' + (explorerOpen ? '' : ' is-collapsed')}>
            {ICONS.chevron}
          </span>
        </button>

        <nav
          className={'workspace-explorer' + (explorerOpen ? '' : ' is-collapsed')}
          aria-label="File explorer"
          aria-hidden={!explorerOpen}
        >
          <div className="workspace-explorer-toolbar">
            <span className="workspace-explorer-toolbar-label">Project</span>
          </div>

          <div className="workspace-explorer-tree">
            <div className="workspace-explorer-tree-inner">
              {activeProject ? (
                renderTree(tree, 0)
              ) : (
                <p className="workspace-explorer-empty">No Active Project</p>
              )}
            </div>
          </div>
        </nav>

        <main className="workspace-main">{renderMainScreen()}</main>
      </div>

      {savePromptOpen && (
        <div className="workspace-modal-overlay" onClick={closeSavePrompt}>
          <div
            className="workspace-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-prompt-title"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => { if (e.key === 'Escape') closeSavePrompt() }}
          >
            <h2 id="save-prompt-title" className="workspace-modal-title">File saved</h2>
            <p className="workspace-save-prompt-text">
              Your file has been saved. Do you want to make a post about it?
            </p>
            <label className="workspace-save-prompt-skip">
              <input
                type="checkbox"
                checked={savePromptSkip}
                onChange={(e) => setSavePromptSkip(e.target.checked)}
              />
              Don&apos;t ask me again
            </label>
            <div className="workspace-modal-actions">
              <button type="button" className="workspace-modal-cancel" onClick={handleReturnToFile}>
                Return to File
              </button>
              <button type="button" className="workspace-modal-create" onClick={handleMakePost}>
                Make Post
              </button>
            </div>
          </div>
        </div>
      )}

      {composerOpen && (
        <div className="workspace-modal-overlay">
          <div className="workspace-modal workspace-modal--wide" role="dialog" aria-modal="true" aria-labelledby="composer-title" onKeyDown={(e) => { if (e.key === 'Escape') closeComposer() }}>
            <h2 id="composer-title" className="workspace-modal-title">New Post</h2>
            <form onSubmit={handlePublishPost}>
              <div className="workspace-composer-author">
                {renderAvatar(
                  auth.currentUser?.displayName || auth.currentUser?.email || 'You',
                  auth.currentUser?.photoURL || null
                )}
                <span className="workspace-feed-user">
                  {auth.currentUser?.displayName || auth.currentUser?.email || 'You'}
                </span>
              </div>

              <div className="workspace-composer-toolbar">
                <button
                  type="button"
                  className={'workspace-composer-tool' + (composerFormats.bold ? ' is-active' : '')}
                  onMouseDown={(e) => applyComposerFormat(e, 'bold')}
                  aria-label="Bold"
                  aria-pressed={composerFormats.bold}
                  title="Bold (Ctrl+B)"
                >
                  <strong>B</strong>
                </button>
                <button
                  type="button"
                  className={'workspace-composer-tool' + (composerFormats.italic ? ' is-active' : '')}
                  onMouseDown={(e) => applyComposerFormat(e, 'italic')}
                  aria-label="Italic"
                  aria-pressed={composerFormats.italic}
                  title="Italic (Ctrl+I)"
                >
                  <em>I</em>
                </button>
                <button
                  type="button"
                  className={'workspace-composer-tool' + (composerFormats.underline ? ' is-active' : '')}
                  onMouseDown={(e) => applyComposerFormat(e, 'underline')}
                  aria-label="Underline"
                  aria-pressed={composerFormats.underline}
                  title="Underline (Ctrl+U)"
                >
                  <span style={{ textDecoration: 'underline' }}>U</span>
                </button>

                <span className="workspace-composer-toolbar-gap" />

                <button
                  type="button"
                  className="workspace-composer-tool workspace-composer-tool--text"
                  onClick={() => composerImageInputRef.current?.click()}
                  disabled={composerImages.length >= MAX_POST_IMAGES}
                >
                  Attach image
                </button>
                <button
                  type="button"
                  className={
                    'workspace-composer-tool workspace-composer-tool--text' + (composerPickerOpen ? ' is-active' : '')
                  }
                  onClick={() => setComposerPickerOpen((open) => !open)}
                  aria-expanded={composerPickerOpen}
                >
                  Link files{composerFileIds.length > 0 ? ` (${composerFileIds.length})` : ''}
                </button>
                <input
                  ref={composerImageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={handleComposerImages}
                />
              </div>

              <div className="workspace-composer-editor-wrap">
                {composerEmpty && (
                  <span className="workspace-composer-placeholder">What do you want to share with the team?</span>
                )}
                <div
                  ref={composerEditorRef}
                  className="workspace-composer-editor"
                  contentEditable
                  suppressContentEditableWarning
                  role="textbox"
                  aria-multiline="true"
                  aria-label="Post text"
                  onInput={handleComposerInput}
                  onPaste={handleComposerPaste}
                  onKeyUp={refreshComposerFormats}
                  onMouseUp={refreshComposerFormats}
                  onFocus={refreshComposerFormats}
                />
              </div>

              {composerImages.length > 0 && (
                <div className="workspace-composer-images">
                  {composerImages.map((image) => (
                    <div key={image.id} className="workspace-composer-image">
                      <img src={image.url} alt={image.name} />
                      <button
                        type="button"
                        className="workspace-composer-remove"
                        onClick={() => removeComposerImage(image.id)}
                        aria-label={`Remove ${image.name}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {composerFileIds.length > 0 && (
                <div className="workspace-composer-chips">
                  {composerFileIds.map((id) => {
                    const file = flattenFiles(tree).find((candidate) => candidate.id === id)
                    if (!file) return null
                    return (
                      <span key={id} className="workspace-composer-chip">
                        <span className="workspace-tree-icon">{FILE_TYPES[file.type]?.icon ?? ICONS.document}</span>
                        {file.name}
                        <button
                          type="button"
                          className="workspace-composer-chip-remove"
                          onClick={() => toggleComposerFile(id)}
                          aria-label={`Unlink ${file.name}`}
                        >
                          ×
                        </button>
                      </span>
                    )
                  })}
                </div>
              )}

              {composerPickerOpen && (
                <div className="workspace-composer-picker">
                  {flattenFiles(tree).length === 0 ? (
                    <p className="workspace-composer-picker-empty">This project has no files yet.</p>
                  ) : (
                    flattenFiles(tree).map((file) => (
                      <label key={file.id} className="workspace-composer-picker-row">
                        <input
                          type="checkbox"
                          checked={composerFileIds.includes(file.id)}
                          onChange={() => toggleComposerFile(file.id)}
                        />
                        <span className="workspace-tree-icon">{FILE_TYPES[file.type]?.icon ?? ICONS.document}</span>
                        <span className="workspace-composer-picker-name">{file.name}</span>
                        {file.folder && <span className="workspace-composer-picker-folder">{file.folder}</span>}
                      </label>
                    ))
                  )}
                </div>
              )}

              {composerError && (
                <p className="workspace-modal-error" role="alert">{composerError}</p>
              )}
              <div className="workspace-modal-actions">
                <button type="button" className="workspace-modal-cancel" onClick={closeComposer}>
                  Cancel
                </button>
                <button type="submit" className="workspace-modal-create">
                  Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {newProjectModalOpen && (
        <div className="workspace-modal-overlay" onClick={closeNewProjectModal}>
          <div className="workspace-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="workspace-modal-title">New Project</h2>
            <form onSubmit={handleCreateProject}>
              <div className="workspace-modal-field">
                <label htmlFor="new-project-name">Project name</label>
                <input
                  id="new-project-name"
                  type="text"
                  autoFocus
                  value={newProjectName}
                  onChange={(e) => {
                    setCreateProjectError('')
                    setNewProjectName(e.target.value)
                  }}
                />
              </div>
              <div className="workspace-modal-field">
                <label htmlFor="new-project-description">Description (optional)</label>
                <textarea
                  id="new-project-description"
                  rows={3}
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                />
              </div>
              {createProjectError && (
                <p className="workspace-modal-error" role="alert">{createProjectError}</p>
              )}
              <div className="workspace-modal-actions">
                <button
                  type="button"
                  className="workspace-modal-cancel"
                  onClick={closeNewProjectModal}
                  disabled={creatingProject}
                >
                  Cancel
                </button>
                <button type="submit" className="workspace-modal-create" disabled={creatingProject}>
                  {creatingProject ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Workspace