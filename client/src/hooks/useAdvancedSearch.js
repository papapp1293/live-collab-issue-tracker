import { useState, useEffect, useCallback } from 'react';
import { searchIssues, getFilterOptions } from '../services/api';

/**
 * Custom hook for managing advanced search functionality
 * Handles search state, filters, pagination, and API calls
 */
export const useAdvancedSearch = (initialFilters = {}) => {
    const [searchResults, setSearchResults] = useState([]);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
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
        limit: 20,
        offset: 0,
        ...initialFilters
    });
    const [filterOptions, setFilterOptions] = useState({
        developers: [],
        testers: [],
        statuses: [],
        assignmentStatuses: [],
        sortOptions: []
    });

    // Load filter options on mount
    useEffect(() => {
        const loadFilterOptions = async () => {
            try {
                const options = await getFilterOptions();
                setFilterOptions(options);
            } catch (err) {
                console.error('Failed to load filter options:', err);
            }
        };

        loadFilterOptions();
    }, []);

    // Perform search with current filters
    const performSearch = useCallback(async (newFilters = filters, appendResults = false) => {
        setLoading(true);
        setError(null);

        try {
            const response = await searchIssues(newFilters);

            if (appendResults) {
                // For "Load More" functionality
                setSearchResults(prev => [...prev, ...response.issues]);
            } else {
                // For new searches
                setSearchResults(response.issues);
            }

            setPagination(response.pagination);
        } catch (err) {
            console.error('Search error:', err);
            setError(err.message || 'Failed to search issues');
            if (!appendResults) {
                setSearchResults([]);
                setPagination({});
            }
        } finally {
            setLoading(false);
        }
    }, [filters]);

    // Handle search with new filters
    const handleSearch = useCallback((newFilters) => {
        const updatedFilters = { ...newFilters, offset: 0 }; // Reset offset for new search
        setFilters(updatedFilters);
        performSearch(updatedFilters, false);
    }, [performSearch]);

    // Handle load more (pagination)
    const handleLoadMore = useCallback(() => {
        if (pagination.hasMore && !loading) {
            const newFilters = { ...filters, offset: filters.offset + filters.limit };
            setFilters(newFilters);
            performSearch(newFilters, true);
        }
    }, [filters, pagination.hasMore, loading, performSearch]);

    // Clear all filters and results
    const clearSearch = useCallback(() => {
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
            sort_order: 'DESC',
            limit: 20,
            offset: 0
        };
        setFilters(clearedFilters);
        setSearchResults([]);
        setPagination({});
        setError(null);
    }, []);

    // Update a specific filter
    const updateFilter = useCallback((key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, []);

    // Check if there are any active filters
    const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
        if (key === 'sort_by' && value === 'created_at') return false;
        if (key === 'sort_order' && value === 'DESC') return false;
        if (key === 'limit' || key === 'offset') return false;
        return value !== '' && value !== null && value !== undefined;
    });

    // Get search summary
    const getSearchSummary = useCallback(() => {
        const activeFilters = [];

        if (filters.search) activeFilters.push(`Text: "${filters.search}"`);
        if (filters.status) activeFilters.push(`Status: ${filters.status}`);
        if (filters.assignment_status) activeFilters.push(`Assignment: ${filters.assignment_status}`);
        if (filters.assigned_developer) {
            const dev = filterOptions.developers.find(d => d.id === parseInt(filters.assigned_developer));
            if (dev) activeFilters.push(`Developer: ${dev.name}`);
        }
        if (filters.assigned_tester) {
            const tester = filterOptions.testers.find(t => t.id === parseInt(filters.assigned_tester));
            if (tester) activeFilters.push(`Tester: ${tester.name}`);
        }
        if (filters.date_from) activeFilters.push(`From: ${filters.date_from}`);
        if (filters.date_to) activeFilters.push(`To: ${filters.date_to}`);
        if (filters.has_ai_summary) {
            activeFilters.push(`AI Summary: ${filters.has_ai_summary === 'true' ? 'Yes' : 'No'}`);
        }

        return activeFilters.length > 0 ? activeFilters.join(', ') : 'All issues';
    }, [filters, filterOptions]);

    return {
        // State
        searchResults,
        pagination,
        loading,
        error,
        filters,
        filterOptions,
        hasActiveFilters,

        // Actions
        handleSearch,
        handleLoadMore,
        clearSearch,
        updateFilter,
        performSearch,
        getSearchSummary
    };
};
