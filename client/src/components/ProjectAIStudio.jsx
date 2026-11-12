import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function ProjectAIStudio({
  generateReadme,
  readmeLoading,
  readmeMessage,
  readmeResult,
  downloadReadme,
  runAI,
  aiLoading,
  aiResult,
  content,
}) {
  return (
    <div className="project-ai-studio">
      <div className="project-section-heading">
        <p className="project-section-eyebrow">AI WORKSPACE</p>
        <h2>AI Studio</h2>
        <p>
          Generate project documentation and use Gemini to explain
          or improve your notes.
        </p>
      </div>

      <section className="project-ai-card">
        <h3>AI README Generator</h3>

        <p>
          Generate a Markdown README using your project description,
          saved notes, and uploaded file information.
        </p>

        <button
          type="button"
          onClick={generateReadme}
          disabled={readmeLoading}
        >
          {readmeLoading ? 'Generating README...' : 'Generate README with AI'}
        </button>

        {readmeMessage && <p role="status">{readmeMessage}</p>}

        {readmeResult && (
          <div className="project-ai-result">
            <h4>Generated README Preview</h4>

            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {readmeResult}
            </ReactMarkdown>

            <button type="button" onClick={downloadReadme}>
              Download README.md
            </button>
          </div>
        )}
      </section>

      <section className="project-ai-card">
        <h3>Gemini Notes Assistant</h3>

        <p>
          Get an explanation of your current notes or suggestions
          to improve them.
        </p>

        <div className="gemini-actions">
          <button
            type="button"
            onClick={() => runAI('explain')}
            disabled={aiLoading || !content.trim()}
          >
            {aiLoading ? 'Thinking...' : 'Explain with AI'}
          </button>

          <button
            type="button"
            onClick={() => runAI('improve')}
            disabled={aiLoading || !content.trim()}
          >
            {aiLoading ? 'Working...' : 'Improve with AI'}
          </button>
        </div>

        {!content.trim() && (
          <p>Write or select a note in the Notes section to use this assistant.</p>
        )}

        {aiResult && (
          <div className="project-ai-result">
            <h4>Gemini Response</h4>

            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {aiResult}
            </ReactMarkdown>
          </div>
        )}
      </section>
    </div>
  )
}

export default ProjectAIStudio