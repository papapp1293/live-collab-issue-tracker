import { useState, useEffect } from 'react';
import { fetchComments, createComment, updateComment, deleteComment } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import socketService from '../services/socket';

const Comment = ({ comment, onReply, onEdit, onDelete, level = 0 }) => {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [submittingReply, setSubmittingReply] = useState(false);
    const [updatingComment, setUpdatingComment] = useState(false);

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
        try {
            await onReply(comment.id, replyContent.trim());
            setReplyContent('');
            setShowReplyForm(false);
        } catch (err) {
            console.error('Failed to reply to comment:', err);
            alert('Failed to reply to comment');
        } finally {
            setSubmittingReply(false);
        }
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
                    <p className="mb-2" style={{ whiteSpace: 'pre-wrap' }}>
                        {comment.content}
                    </p>
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
                        <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            className="textarea w-full mb-2"
                            rows="2"
                            placeholder="Write a reply..."
                        />
                        <div className="flex gap">
                            <button
                                onClick={handleReply}
                                disabled={!replyContent.trim() || submittingReply}
                                className="button primary small"
                            >
                                {submittingReply ? 'Posting...' : 'Post Reply'}
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
        try {
            const comment = await createComment(issueId, newComment.trim());

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
        }
    };

    const handleReply = async (parentCommentId, content) => {
        const reply = await createComment(issueId, content, parentCommentId);

        // Emit socket event for real-time updates
        socketService.emitCommentCreated({
            ...reply,
            issue_id: parseInt(issueId)
        });

        await loadComments();
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
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="textarea w-full mb-2"
                    rows="3"
                    placeholder="Add a comment to this issue..."
                />
                <button
                    onClick={handleCreateComment}
                    disabled={!newComment.trim() || submitting}
                    className="button primary"
                >
                    {submitting ? 'Posting...' : 'Post Comment'}
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
