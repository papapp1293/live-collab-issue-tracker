import { useState, useEffect } from 'react';

/**
 * Advanced Search and Filter Component
 * Provides comprehensive filtering options for issues
 */
const AdvancedSearch = ({
    onSearch,
    onClear,
    filterOptions = {},
    initialFilters = {},
    loading = false
}) => {
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        assigned_developer: '',
        assigned_tester: '',
        date_from: '',
        date_to: '',
        assignment_status: '',
        has_ai_summary: '',
        sort_by: 'created_at',
        sort_order: 'DESC',
        ...initialFilters
    });

    const [expanded, setExpanded] = useState(false);

    // Update filters when initialFilters change
    useEffect(() => {
        setFilters(prev => ({ ...prev, ...initialFilters }));
    }, [initialFilters]);

    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);

        // Auto-search for text input with debounce
        if (key === 'search') {
            // Debounce search
            const timeoutId = setTimeout(() => {
                onSearch(newFilters);
            }, 300);

            // Clear previous timeout
            if (window.searchTimeout) {
                clearTimeout(window.searchTimeout);
            }
            window.searchTimeout = timeoutId;
        } else {
            // For other filters, trigger search immediately
            onSearch(newFilters);
        }
    };

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        onSearch(filters);
    };

    const handleClear = () => {
        const clearedFilters = {
            search: '',
            status: '',
            assigned_developer: '',
            assigned_tester: '',
            date_from: '',
            date_to: '',
            assignment_status: '',
            has_ai_summary: '',
            sort_by: 'created_at',
            sort_order: 'DESC'
        };
        setFilters(clearedFilters);
        onClear();
    };

    const hasActiveFilters = Object.values(filters).some(value =>
        value !== '' && value !== 'created_at' && value !== 'DESC'
    );

    return (
        <div className="advanced-search card p mb-4">
            <div className="flex space-between middle mb-3">
                <h3 className="mb-0">🔍 Search & Filter Issues</h3>
                <div className="flex gap">
                    {hasActiveFilters && (
                        <span className="badge primary small">
                            {Object.values(filters).filter(v => v !== '' && v !== 'created_at' && v !== 'DESC').length} active
                        </span>
                    )}
                    <button
                        type="button"
                        className="button secondary small"
                        onClick={() => setExpanded(!expanded)}
                    >
                        {expanded ? 'Hide Filters' : 'Show Filters'}
                    </button>
                </div>
            </div>

            <form onSubmit={handleSearch}>
                {/* Search Input - Always Visible */}
                <div className="mb-3">
                    <input
                        type="text"
                        placeholder="Search issues by title or description..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="input w-full"
                        style={{ fontSize: '16px', padding: '12px' }}
                    />
                </div>

                {/* Advanced Filters - Collapsible */}
                {expanded && (
                    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        {/* Status Filter */}
                        <div>
                            <label className="label">Status</label>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="select w-full"
                            >
                                <option value="">All Statuses</option>
                                {filterOptions.statuses?.map(status => (
                                    <option key={status.value} value={status.value}>
                                        {status.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Assignment Status Filter */}
                        <div>
                            <label className="label">Assignment Status</label>
                            <select
                                value={filters.assignment_status}
                                onChange={(e) => handleFilterChange('assignment_status', e.target.value)}
                                className="select w-full"
                            >
                                <option value="">All Assignments</option>
                                {filterOptions.assignmentStatuses?.map(status => (
                                    <option key={status.value} value={status.value}>
                                        {status.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Developer Filter */}
                        <div>
                            <label className="label">Assigned Developer</label>
                            <select
                                value={filters.assigned_developer}
                                onChange={(e) => handleFilterChange('assigned_developer', e.target.value)}
                                className="select w-full"
                            >
                                <option value="">All Developers</option>
                                {filterOptions.developers?.map(dev => (
                                    <option key={dev.id} value={dev.id}>
                                        {dev.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Tester Filter */}
                        <div>
                            <label className="label">Assigned Tester</label>
                            <select
                                value={filters.assigned_tester}
                                onChange={(e) => handleFilterChange('assigned_tester', e.target.value)}
                                className="select w-full"
                            >
                                <option value="">All Testers</option>
                                {filterOptions.testers?.map(tester => (
                                    <option key={tester.id} value={tester.id}>
                                        {tester.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Date From */}
                        <div>
                            <label className="label">Created From</label>
                            <input
                                type="date"
                                value={filters.date_from}
                                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                                className="input w-full"
                            />
                        </div>

                        {/* Date To */}
                        <div>
                            <label className="label">Created To</label>
                            <input
                                type="date"
                                value={filters.date_to}
                                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                                className="input w-full"
                            />
                        </div>

                        {/* AI Summary Filter */}
                        <div>
                            <label className="label">AI Summary</label>
                            <select
                                value={filters.has_ai_summary}
                                onChange={(e) => handleFilterChange('has_ai_summary', e.target.value)}
                                className="select w-full"
                            >
                                <option value="">All Issues</option>
                                <option value="true">Has AI Summary</option>
                                <option value="false">No AI Summary</option>
                            </select>
                        </div>

                        {/* Sort By */}
                        <div>
                            <label className="label">Sort By</label>
                            <select
                                value={filters.sort_by}
                                onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                                className="select w-full"
                            >
                                {filterOptions.sortOptions?.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Sort Order */}
                        <div>
                            <label className="label">Sort Order</label>
                            <select
                                value={filters.sort_order}
                                onChange={(e) => handleFilterChange('sort_order', e.target.value)}
                                className="select w-full"
                            >
                                <option value="DESC">Newest First</option>
                                <option value="ASC">Oldest First</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap mt-3">
                    <button
                        type="submit"
                        className="button primary"
                        disabled={loading}
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>

                    {hasActiveFilters && (
                        <button
                            type="button"
                            className="button secondary"
                            onClick={handleClear}
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default AdvancedSearch;
