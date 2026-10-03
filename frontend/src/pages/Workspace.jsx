import { useState } from 'react'
import { useProject } from '../context/useProject'
import './Workspace.css'

/* ---------- Mock data / file-type definitions ----------
   No workspace backend exists yet, so the
   file tree, file contents, and "who else is viewing" presence are all local
   state seeded with sample data. Swapping in real persistence later means
   replacing the useState seeds below with fetched data.
   Editor logic doesn't need to change. */

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

/* Classic MS-Office-style ribbon: a tab strip + grouped tool clusters, with
   a signature accent color per app (Word blue, Excel green, PowerPoint
   orange; SQL/code get invented but analogous colors). Document is also the
   default/placeholder ribbon shown grayed out when nothing is selected. */
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

function findParentId(nodes, id, parentId = 'ROOT') {
  for (const node of nodes) {
    if (node.id === id) return parentId
    if (node.type === 'folder' && node.children) {
      const found = findParentId(node.children, id, node.id)
      if (found !== undefined) return found
    }
  }
  return undefined
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
    /* Not implemented on the backend/provider yet — this is a placeholder
       contract for the backend dev to fill in: createProject({ project_name,
       description }) should create the project, add it to `projects`, and
       set it as the active project (see handleCreateProject below for the
       exact shape this file calls it with). Until then this is undefined and
       the "New Project..." form shows a friendly error instead of crashing. */
    createProject,
  } = useProject()

  /* All hooks run unconditionally, before the loading/error/empty guard
     clauses below. The file tree itself isn't backed by a project-scoped
     endpoint yet, so it's seeded once here. */
  const [tree, setTree] = useState(INITIAL_TREE)
  const [expandedFolders, setExpandedFolders] = useState(
    () => new Set(['folder-docs', 'folder-sheets', 'folder-slides', 'folder-db', 'folder-src'])
  )
  const [selectedId, setSelectedId] = useState('file-proposal')
  const [newFileMenuOpen, setNewFileMenuOpen] = useState(false)
  const [activeCell, setActiveCell] = useState('A1')
  const [activeRibbonTab, setActiveRibbonTab] = useState('Home')
  const [explorerOpen, setExplorerOpen] = useState(true)
  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')
  const [creatingProject, setCreatingProject] = useState(false)
  const [createProjectError, setCreateProjectError] = useState('')

  const handleProjectChange = (event) => {
    const selectedProject = projects.find(
      (project) => String(project.project_id) === event.target.value
    )

    if (selectedProject) {
      setActiveProject(selectedProject)
    }
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
      /* Backend dev: wire up ProjectProvider's createProject and this will
         start working with no changes needed here. */
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

  function selectNode(id) {
    setSelectedId(id)
    setActiveCell('A1')
    setNewFileMenuOpen(false)
    setActiveRibbonTab('Home')
  }

  function updateSelectedFile(updater) {
    if (!selectedId) return
    setTree((prev) => updateNode(prev, selectedId, (node) => ({ ...node, ...updater(node) })))
  }

  function createNewFile(type) {
    const typeInfo = FILE_TYPES[type]
    const count = countFilesOfType(tree, type) + 1
    const baseName = `Untitled ${typeInfo.label} ${count}`
    const name = type === 'code' ? `${baseName}.js` : `${baseName}${typeInfo.extension}`
    const newNode = buildEmptyFileNode(type, name)

    let targetFolder = 'ROOT'
    if (selectedNode) {
      targetFolder =
        selectedNode.type === 'folder' ? selectedNode.id : findParentId(tree, selectedNode.id) ?? 'ROOT'
    }

    setTree((prev) => insertNode(prev, targetFolder, newNode))
    if (targetFolder !== 'ROOT') {
      setExpandedFolders((prev) => new Set(prev).add(targetFolder))
    }
    setSelectedId(newNode.id)
    setActiveCell('A1')
    setNewFileMenuOpen(false)
    setActiveRibbonTab('Home')
  }

  // ---------- Ribbon tool actions ----------

  function toggleDocFormat(key) {
    updateSelectedFile((node) => ({ [key]: !node[key] }))
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
    updateSelectedFile(() => ({ activeSlideIndex: idx }))
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
      return (
        <button
          key={node.id}
          type="button"
          className={'workspace-tree-row workspace-tree-row--file' + (isSelected ? ' is-selected' : '')}
          style={{ paddingLeft: 10 + depth * 16 + 16 }}
          onClick={() => selectNode(node.id)}
        >
          <span className="workspace-tree-icon">{typeInfo?.icon ?? ICONS.document}</span>
          <span className="workspace-tree-label">{node.name}</span>
          {node.viewers?.length > 0 && <span className="workspace-tree-dot" aria-hidden="true" />}
        </button>
      )
    })
  }

  /* A ribbon "group" is Office's unit of organization: a cluster of related
     buttons with a small caption underneath (e.g. "Font", "Paragraph",
     "Clipboard"). Most groups below mix real, wired-up controls (Bold/Align,
     cell formatting, slide management, Run) with purely decorative ones
     (Paste/Cut/Copy, font-name pickers, style galleries) that exist to sell
     the authentic Office look. Those are plain buttons with no onClick, so
     they're visually present but inert rather than faking functionality. */

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

  /* When the ribbon is disabled there's no real node to read formatting
    state from. This stands in so the Word/document groups can still render
    their inert placeholder state instead of crashing on selectedNode.bold etc. */
  const DISABLED_NODE_STATE = { bold: false, italic: false, underline: false, align: 'left', formats: {}, cells: {} }

  function renderHomeGroups() {
    const node = ribbonDisabled ? DISABLED_NODE_STATE : selectedNode
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
              <RibbonButton active={node.bold} onClick={() => toggleDocFormat('bold')}>
                <strong>B</strong>
              </RibbonButton>
              <RibbonButton active={node.italic} onClick={() => toggleDocFormat('italic')}>
                <em>I</em>
              </RibbonButton>
              <RibbonButton active={node.underline} onClick={() => toggleDocFormat('underline')}>
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

  function renderMainScreen() {
    if (!activeProject) {
      return (
        <div className="workspace-empty">
          <p>Create or select a project to start working with files.</p>
        </div>
      )
    }

    if (!selectedNode) {
      return (
        <div className="workspace-empty">
          <p>Select a file to open it, or create a new one from the ribbon.</p>
        </div>
      )
    }

    if (selectedNode.type === 'folder') {
      return (
        <div className="workspace-empty">
          <p>This is a folder. Select a file inside it, or create a new file here.</p>
        </div>
      )
    }

    switch (selectedNode.type) {
      case 'document':
        return (
          <div className="workspace-doc-page">
            <textarea
              className="workspace-doc-textarea"
              style={{
                fontWeight: selectedNode.bold ? 700 : 400,
                fontStyle: selectedNode.italic ? 'italic' : 'normal',
                textDecoration: selectedNode.underline ? 'underline' : 'none',
                textAlign: selectedNode.align,
              }}
              value={selectedNode.content}
              placeholder="Start typing…"
              onChange={(e) => updateSelectedFile(() => ({ content: e.target.value }))}
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

  /* The ribbon is disabled whenever there's no real file to act on,
    no project, no selection or a folder selected. Otherwise,
    it reflects the selected file's type. */
  const ribbonDisabled = !activeProject || !selectedNode || selectedNode.type === 'folder'
  const effectiveType = !ribbonDisabled && RIBBON_THEMES[selectedNode.type] ? selectedNode.type : 'document'
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

          <div className="workspace-ribbon-new">
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
              alongside Home/Insert/Design/etc — it stays enabled even when
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
                >
                  {projects.map((project) => (
                    <option key={project.project_id} value={project.project_id}>
                      {project.project_name}
                    </option>
                  ))}
                </select>
              )}

              {activeProject && selectedNode && selectedNode.type !== 'folder' && (
                <>
                  <span className="workspace-ribbon-context-sep">/</span>
                  <span className="workspace-ribbon-context-file">{selectedNode.name}</span>
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

          <div
            className={'workspace-ribbon-tools-wrap' + (ribbonDisabled ? ' is-disabled' : '')}
            aria-disabled={ribbonDisabled}
          >
            <div className="workspace-ribbon-tools">{renderRibbonGroups()}</div>
          </div>
        </div>
      </div>

      <div className="workspace-body">
        {/* Floating toggle — anchored to a fixed spot in the top-left
            corner of the body, outside the explorer pane itself, so it
            never moves: whether the pane is open or fully hidden, the
            handle to bring it back stays exactly here. */}
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