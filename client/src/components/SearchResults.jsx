import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Search Results Component
 * Displays filtered issues with pagination and actions
 */
const SearchResults = ({
    issues = [],
    pagination = {},
    loading = false,
    onLoadMore = null,
    onIssueAction = null,
    showActions = true,
    showAssignments = true
}) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusBadgeColor = (status) => {
        switch (status) {
            case 'open': return 'primary';
            case 'in_progress': return 'warning';
            case 'closed': return 'success';
            default: return 'secondary';
        }
    };

    const getAssignmentStatusBadge = (issue) => {
        const hasDevAssignment = issue.assigned_developer;
        const hasTestAssignment = issue.assigned_tester;

        if (!hasDevAssignment && !hasTestAssignment) {
            return <span className="badge danger small">Unassigned</span>;
        } else if (!hasDevAssignment) {
            return <span className="badge warning small">Needs Developer</span>;
        } else if (!hasTestAssignment) {
            return <span className="badge warning small">Needs Tester</span>;
        } else {
            return <span className="badge success small">Fully Assigned</span>;
        }
    };

    const handleIssueClick = (issue) => {
        navigate(`/issues/${issue.id}`);
    };

    const handleAssignClick = (e, issue) => {
        e.stopPropagation();
        if (onIssueAction) {
            onIssueAction('assign', issue);
        }
    };

    if (loading) {
        return (
            <div className="search-results">
                <div className="text-center p-6">
                    <div className="spinner mb-3"></div>
                    <p className="text-muted">Searching issues...</p>
                </div>
            </div>
        );
    }

    if (issues.length === 0) {
        return (
            <div className="search-results">
                <div className="card p text-center">
                    <h3 className="mb-3">🔍 No Issues Found</h3>
                    <p className="text-muted mb-4">
                        No issues match your current search criteria. Try adjusting your filters or search terms.
                    </p>
                    <Link to="/issues/create" className="button primary">
                        + Create New Issue
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="search-results">
            {/* Results Header */}
            <div className="flex space-between middle mb-4">
                <div>
                    <h3 className="mb-1">Search Results</h3>
                    <p className="text-muted">
                        Found {pagination.total || issues.length} issue{(pagination.total || issues.length) !== 1 ? 's' : ''}
                        {pagination.total > issues.length && ` (showing ${issues.length})`}
                    </p>
                </div>
                {pagination.total > 0 && (
                    <div className="flex gap">
                        <span className="badge secondary small">
                            {pagination.offset + 1}-{Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total}
                        </span>
                    </div>
                )}
            </div>

            {/* Issues List */}
            <div className="space-y-3">
                {issues.map(issue => (
                    <div
                        key={issue.id}
                        className="card card-hover p cursor-pointer"
                        onClick={() => handleIssueClick(issue)}
                    >
                        <div className="flex space-between gap-4">
                            <div className="flex-grow">
                                <div className="flex middle gap-2 mb-2">
                                    <h4 className="mb-0">{issue.title}</h4>
                                    <span className={`badge ${getStatusBadgeColor(issue.status)} small`}>
                                        {issue.status.replace('_', ' ')}
                                    </span>
                                </div>

                                {/* AI Summary or Description */}
                                {issue.ai_summary ? (
                                    <div className="alert success mb-2" style={{ padding: '8px 12px' }}>
                                        <strong>🤖 AI Summary:</strong> {issue.ai_summary}
                                    </div>
                                ) : (
                                    <div
                                        className="text-muted mb-2"
                                        style={{
                                            maxHeight: '3em',
                                            overflow: 'hidden',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical'
                                        }}
                                        dangerouslySetInnerHTML={{ __html: issue.description }}
                                    />
                                )}

                                {/* Metadata */}
                                <div className="flex gap wrap">
                                    <span className="text-sm text-muted">
                                        Created: {formatDate(issue.created_at)}
                                    </span>

                                    {showAssignments && (
                                        <>
                                            {issue.assigned_developer_name && (
                                                <span className="badge secondary small">
                                                    Dev: {issue.assigned_developer_name}
                                                </span>
                                            )}
                                            {issue.assigned_tester_name && (
                                                <span className="badge secondary small">
                                                    Test: {issue.assigned_tester_name}
                                                </span>
                                            )}
                                            {getAssignmentStatusBadge(issue)}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            {showActions && (
                                <div className="flex gap" style={{ minWidth: 'max-content' }}>
                                    <Link
                                        to={`/issues/${issue.id}/edit`}
                                        className="button secondary small"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        Edit
                                    </Link>

                                    {user?.role === 'manager' && (
                                        <button
                                            onClick={(e) => handleAssignClick(e, issue)}
                                            className="button primary small"
                                        >
                                            👥 Assign
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination / Load More */}
            {pagination.hasMore && (
                <div className="text-center mt-4">
                    <button
                        onClick={() => onLoadMore && onLoadMore()}
                        className="button secondary"
                        disabled={loading}
                    >
                        {loading ? 'Loading...' : 'Load More Issues'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default SearchResults;
