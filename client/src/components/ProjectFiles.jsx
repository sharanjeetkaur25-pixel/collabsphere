import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function ProjectFiles({
  files,
  filesLoading,
  handleFileUpload,
  uploading,
  fileMessage,
  getExtension,
  codeExtensions,
  previewFile,
  previewLoading,
  explainCode,
  codeLoading,
  deleteFile,
  selectedFile,
  closePreview,
  previewText,
  previewUrl,
  textExtensions,
  codeResult,
}) {
  return (
    <div className="project-files">
      <div className="project-section-heading">
        <p className="project-section-eyebrow">PROJECT RESOURCES</p>
        <h2>Project Files</h2>
        <p>
          Upload project resources, preview supported files, and use
          Gemini to understand your code.
        </p>
        <p>
          <small>
            Maximum file size: 5 MB. Supported types include PDF,
            images, text, Markdown, JavaScript, Python, Java, HTML,
            CSS, and JSON.
          </small>
        </p>
      </div>

      <div className="project-files-card">
        <h3>Upload a File</h3>

        <form onSubmit={handleFileUpload}>
          <label htmlFor="project-file">Choose a file</label>

          <input
            id="project-file"
            name="project-file"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.txt,.md,.js,.jsx,.ts,.tsx,.json,.css,.html,.py,.java"
            required
          />

          <button type="submit" disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>
        </form>

        {fileMessage && <p role="status">{fileMessage}</p>}
      </div>

      <div className="project-files-card">
        <h3>Uploaded Files</h3>

        {filesLoading ? (
          <p>Loading files...</p>
        ) : files.length === 0 ? (
          <p>No files uploaded yet.</p>
        ) : (
          <ul className="project-file-list">
            {files.map((file) => {
              const extension = getExtension(file.originalName)
              const canExplain = codeExtensions.includes(extension)

              return (
                <li key={file._id} className="project-file-item">
                  <div className="project-file-information">
                    <strong>{file.originalName}</strong>

                    <small>
                      {(file.size / 1024).toFixed(1)} KB
                      {' · Uploaded by '}
                      {file.uploadedBy?.name ||
                        file.uploadedBy?.email ||
                        'Unknown user'}
                    </small>
                  </div>

                  <div className="project-file-actions">
                    <button
                      type="button"
                      onClick={() => previewFile(file)}
                      disabled={previewLoading}
                    >
                      Preview
                    </button>

                    {canExplain && (
                      <button
                        type="button"
                        onClick={() => explainCode(file)}
                        disabled={codeLoading}
                      >
                        {codeLoading
                          ? 'Gemini is thinking...'
                          : 'Explain Code with AI'}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => deleteFile(file)}
                    >
                      Delete File
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {previewLoading && (
        <p role="status">Loading file preview...</p>
      )}

      {selectedFile && !previewLoading && (
        <section className="project-file-preview">
          <div className="project-section-heading">
            <h3>Preview: {selectedFile.originalName}</h3>

            <button type="button" onClick={closePreview}>
              Close Preview
            </button>
          </div>

          {textExtensions.includes(
            getExtension(selectedFile.originalName)
          ) ? (
            <pre className="project-file-text-preview">
              {previewText || '(This file is empty.)'}
            </pre>
          ) : selectedFile.mimeType?.startsWith('image/') &&
            previewUrl ? (
            <img
              className="project-file-image-preview"
              src={previewUrl}
              alt={selectedFile.originalName}
            />
          ) : selectedFile.mimeType === 'application/pdf' &&
            previewUrl ? (
            <iframe
              className="project-file-pdf-preview"
              title={`Preview of ${selectedFile.originalName}`}
              src={previewUrl}
            />
          ) : previewUrl ? (
            <p>
              This file type cannot be displayed inline.{' '}
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                download={selectedFile.originalName}
              >
                Open or download file
              </a>
            </p>
          ) : null}
        </section>
      )}

      {codeResult && (
        <section className="project-file-preview">
          <div className="project-section-heading">
            <h3>✨ Gemini Code Explanation</h3>
          </div>

          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {codeResult}
          </ReactMarkdown>
        </section>
      )}
    </div>
  )
}

export default ProjectFiles