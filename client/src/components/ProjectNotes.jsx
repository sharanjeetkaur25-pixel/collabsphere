import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function ProjectNotes({
  notes,
  notesLoading,
  selectedNoteId,
  startNewNote,
  selectNote,
  saveNote,
  deleteNote,
  title,
  setTitle,
  content,
  setContent,
  saving,
  noteMessage,
}) {
  return (
    <div className="project-notes">
      <div className="project-section-heading">
        <p className="project-section-eyebrow">DOCUMENTATION</p>
        <h2>Markdown Notes</h2>
        <p>
          Write project notes in Markdown and see the formatted result
          in the live preview.
        </p>
      </div>

      <div className="notes-workspace">
        <aside className="notes-sidebar">
          <button type="button" onClick={startNewNote}>
            + New Note
          </button>

          {notesLoading ? (
            <p>Loading notes...</p>
          ) : notes.length === 0 ? (
            <p>No notes yet. Create your first note.</p>
          ) : (
            <ul>
              {notes.map((note) => (
                <li key={note._id}>
                  <button
                    type="button"
                    onClick={() => selectNote(note)}
                    aria-pressed={selectedNoteId === note._id}
                  >
                    {note.title}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <form className="note-editor" onSubmit={saveNote}>
          <label htmlFor="note-title">Note title</label>

          <input
            id="note-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Project requirements"
            maxLength={150}
            required
          />

          <label htmlFor="note-content">Markdown content</label>

          <textarea
            id="note-content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder={'# Project Notes\n\nWrite your notes here...\n\n- First task\n- Second task'}
            rows={14}
          />

          <section className="markdown-preview">
            <h3>Markdown Preview</h3>

            {content.trim() ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            ) : (
              <p>
                Your formatted Markdown will appear here as you type.
              </p>
            )}
          </section>

          <div className="note-editor-actions">
            <button type="submit" disabled={saving}>
              {saving
                ? 'Saving...'
                : selectedNoteId
                  ? 'Save Changes'
                  : 'Save Note'}
            </button>

            {selectedNoteId && (
              <button type="button" onClick={deleteNote}>
                Delete Note
              </button>
            )}
          </div>

          {noteMessage && <p role="status">{noteMessage}</p>}
        </form>
      </div>
    </div>
  )
}

export default ProjectNotes