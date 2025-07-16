import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createIssue, fetchUsersByRole, updateIssue } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import socketService from '../services/socket';
import { useImagePaste } from '../hooks/useImagePaste';
import { imageUploadService } from '../services/imageUpload';
import ContentEditor from '../components/ContentEditor';

export default function CreateIssue() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [issue, setIssue] = useState({
    title: '',
    description: '',
    assigned_developer: '',
    assigned_tester: '',
    status: 'open',
  });
  const [developers, setDevelopers] = useState([]);
  const [testers, setTesters] = useState([]);
  const [error, setError] = useState(null);
  const [createdIssue, setCreatedIssue] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const descriptionRef = useRef(null);

  // Use the image paste hook
  const { pastedImages, clearPastedImages } = useImagePaste(descriptionRef, () => {
    updateDescriptionFromEditor();
  });

  useEffect(() => {
    // Only managers can assign during creation, others create unassigned issues
    if (user?.role === 'manager') {
      fetchUsersByRole('developer')
        .then(setDevelopers)
        .catch(() => setError('Failed to load developers'));

      fetchUsersByRole('tester')
        .then(setTesters)
        .catch(() => setError('Failed to load testers'));
    }
  }, [user]);

  const handleChange = (e) => {
    setIssue({ ...issue, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate description content
    const descriptionContent = descriptionRef.current?.textContent?.trim() || '';
    if (!descriptionContent) {
      setError('Description is required');
      return;
    }

    try {
      const newIssue = await createIssue({
        title: issue.title,
        description: issue.description || descriptionContent, // Use HTML content
        assigned_developer: issue.assigned_developer ? parseInt(issue.assigned_developer) : null,
        assigned_tester: issue.assigned_tester ? parseInt(issue.assigned_tester) : null,
      });      // Upload any pasted images after issue creation
      if (pastedImages.length > 0) {
        setUploading(true);
        const uploadResults = await imageUploadService.uploadPastedImages(pastedImages, newIssue.id);

        // Check for any failed uploads
        const failedUploads = uploadResults.filter(result => !result.success);
        if (failedUploads.length > 0) {
          console.warn('Some images failed to upload:', failedUploads);
        }

        // Replace blob URLs with server URLs in the issue description
        const successfulUploads = uploadResults.filter(result => result.success);
        if (successfulUploads.length > 0) {
          const updatedDescription = imageUploadService.replaceBlobUrlsWithServerUrls(
            descriptionRef.current.innerHTML,
            successfulUploads
          );

          // Update the issue on the server with corrected URLs
          await updateIssue(newIssue.id, { description: updatedDescription });
        }

        // Clean up blob URLs
        imageUploadService.cleanupImageUrls(uploadResults);
        clearPastedImages();
        setUploading(false);
      }

      // Show success message with AI summary if available
      setCreatedIssue(newIssue);
      setShowSuccess(true);

      // Emit Socket event for real-time updates
      socketService.emitIssueCreated(newIssue);

      // Navigate after a brief delay to show the success message
      setTimeout(() => {
        navigate('/issues');
      }, 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to create issue');
      setUploading(false);
    }
  };

  const updateDescriptionFromEditor = () => {
    if (descriptionRef.current) {
      // Convert contentEditable content to HTML, preserving structure
      const content = descriptionRef.current.innerHTML;
      setIssue(prev => ({
        ...prev,
        description: content
      }));
    }
  };

  if (error) return <p className="alert error">{error}</p>;

  if (showSuccess && createdIssue) {
    return (
      <div className="container" style={{ maxWidth: '600px' }}>
        <div className="card p">
          <h2 className="title text-center mb-3">✅ Issue Created Successfully!</h2>
          <div className="mb-3">
            <h3>{createdIssue.title}</h3>
            <div
              className="text-muted"
              dangerouslySetInnerHTML={{ __html: createdIssue.description }}
            />
          </div>

          {createdIssue.ai_summary && (
            <div className="alert success mb-3">
              <div className="flex middle gap mb-1">
                <strong>🤖 AI Summary (auto-generated):</strong>
                <span className="badge success text-sm">Saved to database</span>
              </div>
              <p className="mt-1 mb-0">{createdIssue.ai_summary}</p>
              <p className="text-sm text-muted mt-1 mb-0">
                💡 This summary is saved and will be reused. You can regenerate it from the issue details page if needed.
              </p>
            </div>
          )}

          {!createdIssue.ai_summary && (
            <div className="alert info mb-3">
              <strong>ℹ️ AI Summary:</strong>
              <p className="mt-1 mb-0">AI summary not generated (OpenAI not configured or error occurred). You can generate one later from the issue details page.</p>
            </div>
          )}

          <p className="text-center text-muted">Redirecting to issues list...</p>

          <div className="flex gap justify-center mt-3">
            <Link to="/issues" className="button primary">
              View All Issues
            </Link>
            <Link to={`/issues/${createdIssue.id}`} className="button secondary">
              View Issue Details
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '600px' }}>
      <div className="flex space-between middle mb-3">
        <h2 className="title">Create New Issue</h2>
        <Link to="/issues" className="button secondary small" style={{ minWidth: '32px', textAlign: 'center' }}>
          ✕
        </Link>
      </div>
      <form onSubmit={handleSubmit} className="form stacked">
        <label htmlFor="title">Title</label>
        <input
          id="title"
          name="title"
          type="text"
          value={issue.title}
          onChange={handleChange}
          required
        />

        <label htmlFor="description">Description *</label>
        <ContentEditor
          ref={descriptionRef}
          placeholder="Describe the issue... (You can paste images directly here)"
          minHeight="200px"
          maxHeight="400px"
          onContentChange={updateDescriptionFromEditor}
        />

        {pastedImages.length > 0 && (
          <div className="mb-3">
            <p className="text-sm text-muted">Images will be uploaded when issue is created.</p>
          </div>
        )}

        {user?.role === 'manager' && (
          <>
            <label htmlFor="assigned_developer">Assign Developer</label>
            <select
              id="assigned_developer"
              name="assigned_developer"
              value={issue.assigned_developer}
              onChange={handleChange}
            >
              <option value="">No Developer Assigned</option>
              {developers.map((dev) => (
                <option key={dev.id} value={dev.id}>
                  {dev.name} ({dev.email})
                </option>
              ))}
            </select>

            <label htmlFor="assigned_tester">Assign Tester</label>
            <select
              id="assigned_tester"
              name="assigned_tester"
              value={issue.assigned_tester}
              onChange={handleChange}
            >
              <option value="">No Tester Assigned</option>
              {testers.map((tester) => (
                <option key={tester.id} value={tester.id}>
                  {tester.name} ({tester.email})
                </option>
              ))}
            </select>
          </>
        )}

        {user?.role !== 'manager' && (
          <div className="alert info">
            <strong>ℹ️ Assignment:</strong>
            <p className="mt-1 mb-0">Issue will be created unassigned. Managers can assign developers and testers later.</p>
          </div>
        )}

        <button type="submit" className="button primary mt-3" disabled={uploading}>
          {uploading ? 'Creating Issue...' : 'Create Issue'}
        </button>
      </form>
    </div>
  );
}
