import { useState, useEffect, useRef } from 'react';
import { fetchComments, createComment, updateComment, deleteComment } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import socketService from '../services/socket';
import { useImagePaste } from '../hooks/useImagePaste';
import { imageUploadService } from '../services/imageUpload';

const Comment = ({ comment, onReply, onEdit, onDelete, level = 0 }) => {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [submittingReply, setSubmittingReply] = useState(false);
    const [updatingComment, setUpdatingComment] = useState(false);
    const [replyPastedImages, setReplyPastedImages] = useState([]);
    const [replyUploading, setReplyUploading] = useState(false);
    const replyEditorRef = useRef(null);

    const canEdit = user?.id === comment.user_id;
    const canDelete = user?.id === comment.user_id || user?.role === 'manager';

    const handleEdit = async () => {
        if (!editContent.trim()) return;

        setUpdatingComment(true);
        try {
            await onEdit(comment.id, editContent.trim());
            setIsEditing(false);
        } catch (err) {
            console.error('Failed to update comment:', err);
            alert('Failed to update comment');
        } finally {
            setUpdatingComment(false);
        }
    };

    const handleReply = async () => {
        if (!replyContent.trim()) return;

        setSubmittingReply(true);
        setReplyUploading(true);
        try {
            const reply = await onReply(comment.id, replyContent.trim());

            // Upload any pasted images for the reply
            if (replyPastedImages.length > 0) {
                const uploadResults = await imageUploadService.uploadPastedImages(replyPastedImages, comment.issue_id, reply.id);

                // Check for failed uploads
                const failedUploads = uploadResults.filter(result => !result.success);
                if (failedUploads.length > 0) {
                    console.warn('Some images failed to upload:', failedUploads);
                }

                // Replace blob URLs with server URLs in the reply content
                const successfulUploads = uploadResults.filter(result => result.success);
                if (successfulUploads.length > 0) {
                    const updatedContent = imageUploadService.replaceBlobUrlsWithServerUrls(
                        replyContent.trim(),
                        successfulUploads
                    );

                    // Update the reply with corrected URLs
                    await updateComment(reply.id, updatedContent);
                }

                // Clean up blob URLs
                imageUploadService.cleanupImageUrls(uploadResults);
                setReplyPastedImages([]);
            }

            setReplyContent('');
            setShowReplyForm(false);
        } catch (err) {
            console.error('Failed to reply to comment:', err);
            alert('Failed to reply to comment');
        } finally {
            setSubmittingReply(false);
            setReplyUploading(false);
        }
    };

    const handleReplyPaste = async (e) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.kind === 'file' && item.type.startsWith('image/')) {
                e.preventDefault(); // Prevent default paste behavior
                const file = item.getAsFile();

                // Clear the editor if it's empty or only has placeholder content
                const editor = replyEditorRef.current;
                if (editor && (editor.textContent.trim() === '' || editor.innerHTML.trim() === '')) {
                    editor.innerHTML = '';
                }

                // Create object URL for immediate display
                const imageUrl = URL.createObjectURL(file);

                // Create img element
                const img = document.createElement('img');
                img.src = imageUrl;
                img.alt = file.name || 'Pasted image';
                img.style.maxWidth = '100%';
                img.style.height = 'auto';
                img.style.display = 'block';
                img.style.margin = '10px 0';
                img.style.border = '1px solid #ddd';
                img.style.borderRadius = '4px';

                // Insert image at cursor position or at the end
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    range.deleteContents(); // Clear any selected content
                    range.insertNode(img);

                    // Move cursor after the image
                    range.setStartAfter(img);
                    range.setEndAfter(img);
                    selection.removeAllRanges();
                    selection.addRange(range);
                } else {
                    // No selection, append to end
                    replyEditorRef.current.appendChild(img);
                }

                // Store file for upload later
                setReplyPastedImages(prev => [...prev, { file, imageUrl }]);

                // Update the reply content with the current content
                updateReplyFromEditor();
            }
        }
    };

    const updateReplyFromEditor = () => {
        if (replyEditorRef.current) {
            const content = replyEditorRef.current.innerHTML;
            setReplyContent(content);
        }
    };

    const handleReplyChange = () => {
        updateReplyFromEditor();
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this comment?')) {
            try {
                await onDelete(comment.id);
            } catch (err) {
                console.error('Failed to delete comment:', err);
                alert('Failed to delete comment');
            }
        }
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString();
    };

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'manager': return 'danger';
            case 'developer': return 'primary';
            case 'tester': return 'success';
            default: return 'secondary';
        }
    };

    return (
        <div
            className="comment"
            style={{
                marginLeft: `${level * 2}rem`,
                borderLeft: level > 0 ? '2px solid #e9ecef' : 'none',
                paddingLeft: level > 0 ? '1rem' : '0',
                marginBottom: '1rem'
            }}
        >
            <div className="card p">
                <div className="flex space-between middle mb-2">
                    <div className="flex middle gap">
                        <strong>{comment.user_name}</strong>
                        <span className={`badge ${getRoleBadgeColor(comment.user_role)} small`}>
                            {comment.user_role}
                        </span>
                        <span className="text-muted text-sm">
                            {formatTime(comment.created_at)}
                            {comment.updated_at !== comment.created_at && ' (edited)'}
                        </span>
                    </div>

                    <div className="flex gap">
                        {canEdit && (
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className="button secondary small"
                                disabled={updatingComment}
                            >
                                {isEditing ? 'Cancel' : 'Edit'}
                            </button>
                        )}

                        {canDelete && (
                            <button
                                onClick={handleDelete}
                                className="button danger small"
                            >
                                Delete
                            </button>
                        )}
                    </div>
                </div>

                {isEditing ? (
                    <div className="mb-2">
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="textarea w-full mb-2"
                            rows="3"
                            placeholder="Edit your comment..."
                        />
                        <div className="flex gap">
                            <button
                                onClick={handleEdit}
                                disabled={!editContent.trim() || updatingComment}
                                className="button primary small"
                            >
                                {updatingComment ? 'Updating...' : 'Update'}
                            </button>
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setEditContent(comment.content);
                                }}
                                className="button secondary small"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div
                        className="mb-2"
                        style={{ whiteSpace: 'pre-wrap' }}
                        dangerouslySetInnerHTML={{ __html: comment.content }}
                    />
                )}

                {!isEditing && (
                    <div className="flex gap">
                        <button
                            onClick={() => setShowReplyForm(!showReplyForm)}
                            className="button secondary small"
                        >
                            {showReplyForm ? 'Cancel Reply' : 'Reply'}
                        </button>

                        {comment.reply_count > 0 && (
                            <span className="text-muted text-sm">
                                {comment.reply_count} {comment.reply_count === 1 ? 'reply' : 'replies'}
                            </span>
                        )}
                    </div>
                )}

                {showReplyForm && (
                    <div className="mt-3">
                        <div
                            ref={replyEditorRef}
                            contentEditable
                            onInput={handleReplyChange}
                            onPaste={handleReplyPaste}
                            style={{
                                minHeight: '60px',
                                maxHeight: '200px',
                                overflow: 'auto',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                padding: '8px',
                                fontSize: '14px',
                                lineHeight: '1.4',
                                backgroundColor: 'white',
                                whiteSpace: 'pre-wrap',
                                outline: 'none',
                                marginBottom: '8px'
                            }}
                            data-placeholder="Write a reply... (You can paste images directly here)"
                            suppressContentEditableWarning={true}
                            onFocus={(e) => {
                                // Clear placeholder text when focused
                                if (e.target.textContent === '') {
                                    e.target.innerHTML = '';
                                }
                            }}
                        />
                        <style jsx>{`
                            [contenteditable]:empty:before {
                                content: attr(data-placeholder);
                                color: #999;
                                font-style: italic;
                                pointer-events: none;
                            }
                            [contenteditable]:focus:before {
                                content: none;
                            }
                            [contenteditable] img {
                                pointer-events: auto;
                            }
                        `}</style>

                        <div className="flex gap">
                            <button
                                onClick={handleReply}
                                disabled={!replyContent.trim() || submittingReply || replyUploading}
                                className="button primary small"
                            >
                                {replyUploading ? 'Uploading...' : (submittingReply ? 'Posting...' : 'Post Reply')}
                            </button>
                            <button
                                onClick={() => {
                                    setShowReplyForm(false);
                                    setReplyContent('');
                                }}
                                className="button secondary small"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Render replies */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="replies mt-2">
                    {comment.replies.map(reply => (
                        <Comment
                            key={reply.id}
                            comment={reply}
                            onReply={onReply}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            level={level + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default function Comments({ issueId }) {
    const { user } = useAuth();
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [pastedImages, setPastedImages] = useState([]);
    const [uploading, setUploading] = useState(false);
    const commentEditorRef = useRef(null);

    const loadComments = async () => {
        try {
            setLoading(true);
            const commentsData = await fetchComments(issueId);
            setComments(commentsData);
            setError(null);
        } catch (err) {
            console.error('Failed to load comments:', err);
            setError('Failed to load comments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (issueId) {
            loadComments();
        }

        // Set up Socket.IO listeners for real-time comment updates
        socketService.onCommentCreated((commentData) => {
            if (commentData.issue_id === parseInt(issueId)) {
                loadComments(); // Reload to maintain threading structure
            }
        });

        socketService.onCommentUpdated((commentData) => {
            if (commentData.issue_id === parseInt(issueId)) {
                loadComments(); // Reload to maintain threading structure
            }
        });

        socketService.onCommentDeleted((commentData) => {
            if (commentData.issue_id === parseInt(issueId)) {
                loadComments(); // Reload to maintain threading structure
            }
        });

        return () => {
            socketService.removeListener('comment:created');
            socketService.removeListener('comment:updated');
            socketService.removeListener('comment:deleted');
        };
    }, [issueId]);

    const handleCreateComment = async () => {
        if (!newComment.trim()) return;

        setSubmitting(true);
        setUploading(true);
        try {
            const comment = await createComment(issueId, newComment.trim());

            // Upload any pasted images for the new comment
            if (pastedImages.length > 0) {
                const uploadResults = await imageUploadService.uploadPastedImages(pastedImages, parseInt(issueId), comment.id);

                // Check for failed uploads
                const failedUploads = uploadResults.filter(result => !result.success);
                if (failedUploads.length > 0) {
                    console.warn('Some images failed to upload:', failedUploads);
                }

                // Replace blob URLs with server URLs in the comment content
                const successfulUploads = uploadResults.filter(result => result.success);
                if (successfulUploads.length > 0) {
                    const updatedContent = imageUploadService.replaceBlobUrlsWithServerUrls(
                        newComment.trim(),
                        successfulUploads
                    );

                    // Update the comment with corrected URLs
                    await updateComment(comment.id, updatedContent);
                }

                // Clean up blob URLs
                imageUploadService.cleanupImageUrls(uploadResults);
                setPastedImages([]);
            }

            // Emit socket event for real-time updates
            socketService.emitCommentCreated({
                ...comment,
                issue_id: parseInt(issueId)
            });

            setNewComment('');
            await loadComments();
        } catch (err) {
            console.error('Failed to create comment:', err);
            alert('Failed to create comment');
        } finally {
            setSubmitting(false);
            setUploading(false);
        }
    }; const handlePaste = async (e) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.kind === 'file' && item.type.startsWith('image/')) {
                e.preventDefault(); // Prevent default paste behavior
                const file = item.getAsFile();

                // Clear the editor if it's empty or only has placeholder content
                if (commentEditorRef.current &&
                    (commentEditorRef.current.textContent.trim() === '' ||
                        commentEditorRef.current.innerHTML.trim() === '')) {
                    commentEditorRef.current.innerHTML = '';
                }

                // Create object URL for immediate display
                const imageUrl = URL.createObjectURL(file);

                // Create img element
                const img = document.createElement('img');
                img.src = imageUrl;
                img.alt = file.name || 'Pasted image';
                img.style.maxWidth = '100%';
                img.style.height = 'auto';
                img.style.display = 'block';
                img.style.margin = '10px 0';
                img.style.border = '1px solid #ddd';
                img.style.borderRadius = '4px';

                // Insert image at cursor position or at the end
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    range.deleteContents(); // Clear any selected content
                    range.insertNode(img);

                    // Move cursor after the image
                    range.setStartAfter(img);
                    range.setEndAfter(img);
                    selection.removeAllRanges();
                    selection.addRange(range);
                } else {
                    // No selection, append to end
                    commentEditorRef.current.appendChild(img);
                }

                // Store file for upload later
                setPastedImages(prev => [...prev, { file, imageUrl }]);

                // Update the comment content with the current content
                updateCommentFromEditor();
            }
        }
    };

    const updateCommentFromEditor = () => {
        if (commentEditorRef.current) {
            const content = commentEditorRef.current.innerHTML;
            setNewComment(content);
        }
    };

    const handleCommentChange = () => {
        updateCommentFromEditor();
    };

    const handleReply = async (parentCommentId, content) => {
        const reply = await createComment(issueId, content, parentCommentId);

        // Emit socket event for real-time updates
        socketService.emitCommentCreated({
            ...reply,
            issue_id: parseInt(issueId)
        });

        await loadComments();
        return reply; // Return the created reply so it can be used for file uploads
    };

    const handleEdit = async (commentId, content) => {
        const updatedComment = await updateComment(commentId, content);

        // Emit socket event for real-time updates
        socketService.emitCommentUpdated({
            ...updatedComment,
            issue_id: parseInt(issueId)
        });

        await loadComments();
    };

    const handleDelete = async (commentId) => {
        await deleteComment(commentId);

        // Emit socket event for real-time updates
        socketService.emitCommentDeleted({
            id: commentId,
            issue_id: parseInt(issueId)
        });

        await loadComments();
    };

    if (loading) return <div className="p">Loading comments...</div>;

    return (
        <div className="comments-section">
            <div className="flex space-between middle mb-4">
                <h3>Discussion ({comments.length})</h3>
            </div>

            {error && <div className="alert error mb-3">{error}</div>}

            {/* New comment form */}
            <div className="card p mb-4">
                <div className="flex middle gap mb-2">
                    <strong>{user?.name}</strong>
                    <span className={`badge ${comments.length > 0 ? 'primary' : 'secondary'} small`}>
                        {user?.role}
                    </span>
                </div>
                <div
                    ref={commentEditorRef}
                    contentEditable
                    onInput={handleCommentChange}
                    onPaste={handlePaste}
                    style={{
                        minHeight: '80px',
                        maxHeight: '300px',
                        overflow: 'auto',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        padding: '12px',
                        fontSize: '14px',
                        lineHeight: '1.5',
                        backgroundColor: 'white',
                        whiteSpace: 'pre-wrap',
                        outline: 'none',
                        marginBottom: '12px'
                    }}
                    data-placeholder="Add a comment to this issue... (You can paste images directly here)"
                    suppressContentEditableWarning={true}
                    onFocus={(e) => {
                        // Clear placeholder text when focused
                        if (e.target.textContent === '') {
                            e.target.innerHTML = '';
                        }
                    }}
                />
                <style jsx>{`
                    [contenteditable]:empty:before {
                        content: attr(data-placeholder);
                        color: #999;
                        font-style: italic;
                        pointer-events: none;
                    }
                    [contenteditable]:focus:before {
                        content: none;
                    }
                    [contenteditable] img {
                        pointer-events: auto;
                    }
                `}</style>

                {pastedImages.length > 0 && (
                    <div className="mb-3">
                        <p className="text-sm text-muted">Images will be uploaded when comment is posted.</p>
                    </div>
                )}

                <button
                    onClick={handleCreateComment}
                    disabled={!newComment.trim() || submitting || uploading}
                    className="button primary"
                >
                    {uploading ? 'Uploading Images...' : (submitting ? 'Posting...' : 'Post Comment')}
                </button>
            </div>

            {/* Comments list */}
            {comments.length === 0 ? (
                <div className="card p text-center text-muted">
                    <p>No comments yet. Be the first to start the discussion!</p>
                </div>
            ) : (
                <div className="comments-list">
                    {comments.map(comment => (
                        <Comment
                            key={comment.id}
                            comment={comment}
                            onReply={handleReply}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}