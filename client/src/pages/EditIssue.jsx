import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchIssue, updateIssue, fetchUsersByRole } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import socketService from '../services/socket';
import { useImagePaste } from '../hooks/useImagePaste';
import { imageUploadService } from '../services/imageUpload';
import ContentEditor from '../components/ContentEditor';

export default function EditIssue() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [issue, setIssue] = useState(null);
    const [developers, setDevelopers] = useState([]);
    const [testers, setTesters] = useState([]);
    const [error, setError] = useState(null);
    const [uploading, setUploading] = useState(false);
    const descriptionRef = useRef(null);

    // Use the image paste hook
    const { pastedImages, clearPastedImages } = useImagePaste(descriptionRef, () => {
        updateDescriptionFromEditor();
    });

    const isManager = user?.role === 'manager';

    useEffect(() => {
        fetchIssue(id).then((foundIssue) => {
            if (foundIssue) {
                setIssue(foundIssue);
                // Set initial content if editing
                if (descriptionRef.current && foundIssue.description) {
                    descriptionRef.current.innerHTML = foundIssue.description;
                }
            } else {
                setError('Issue not found');
            }
        }).catch(() => setError('Failed to load issue'));

        fetchUsersByRole('developer').then(setDevelopers).catch(() => {
            if (isManager) setError('Failed to load developers');
        });
        fetchUsersByRole('tester').then(setTesters).catch(() => {
            if (isManager) setError('Failed to load testers');
        });
    }, [id, isManager]);

    const handleChange = (e) => {
        setIssue({ ...issue, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const updateData = {
                title: issue.title,
                description: issue.description,
                status: issue.status,
            };

            // Only include assignment fields if user is a manager
            if (isManager) {
                updateData.assigned_developer = parseInt(issue.assigned_developer) || null;
                updateData.assigned_tester = parseInt(issue.assigned_tester) || null;
            }

            const updatedIssue = await updateIssue(id, updateData);

            // Upload any pasted images after issue update
            if (pastedImages.length > 0) {
                setUploading(true);
                const uploadResults = await imageUploadService.uploadPastedImages(pastedImages, parseInt(id));

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

                    // Update the issue again with corrected URLs
                    await updateIssue(id, { description: updatedDescription });
                }

                // Clean up blob URLs
                imageUploadService.cleanupImageUrls(uploadResults);
                clearPastedImages();
                setUploading(false);
            }

            // Emit Socket event for real-time updates
            socketService.emitIssueUpdated({ ...updatedIssue, id: parseInt(id) });

            navigate(`/issues/${id}`);
        } catch (err) {
            console.error(err);
            setError('Failed to update issue');
            setUploading(false);
        }
    };

    const updateDescriptionFromEditor = () => {
        if (descriptionRef.current) {
            // Convert contentEditable content to HTML
            const content = descriptionRef.current.innerHTML;
            setIssue(prev => ({
                ...prev,
                description: content
            }));
        }
    };

    if (error) return <p className="alert error">{error}</p>;
    if (!issue) return <p className="p">Loading...</p>;

    return (
        <div className="container" style={{ maxWidth: '600px' }}>
            <div className="flex space-between middle mb-3">
                <h2 className="title">Edit Issue</h2>
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
                    initialContent={issue?.description || ''}
                />

                <label htmlFor="status">Status</label>
                <select
                    id="status"
                    name="status"
                    value={issue.status}
                    onChange={handleChange}
                    required
                >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="closed">Closed</option>
                </select>

                <label htmlFor="assigned_developer">Assigned Developer</label>
                <select
                    id="assigned_developer"
                    name="assigned_developer"
                    value={issue.assigned_developer || ''}
                    onChange={handleChange}
                    disabled={!isManager}
                >
                    <option value="">No Developer Assigned</option>
                    {developers.map((user) => (
                        <option key={user.id} value={user.id}>
                            {user.name} ({user.email})
                        </option>
                    ))}
                </select>
                {!isManager && <small className="text-muted">Only managers can assign developers</small>}

                <label htmlFor="assigned_tester">Assigned Tester</label>
                <select
                    id="assigned_tester"
                    name="assigned_tester"
                    value={issue.assigned_tester || ''}
                    onChange={handleChange}
                    disabled={!isManager}
                >
                    <option value="">No Tester Assigned</option>
                    {testers.map((user) => (
                        <option key={user.id} value={user.id}>
                            {user.name} ({user.email})
                        </option>
                    ))}
                </select>
                {!isManager && <small className="text-muted">Only managers can assign testers</small>}

                <div className="mt-3">
                    <button type="submit" className="button primary" disabled={uploading}>
                        {uploading ? 'Uploading Images...' : 'Update Issue'}
                    </button>
                </div>
            </form>
        </div>
    );
}
