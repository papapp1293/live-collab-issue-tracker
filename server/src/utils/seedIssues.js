// server/src/utils/seedIssues.js
const db = require('./db');

async function seedIssues() {
    const issues = [
        [
            'Login Authentication Bug',
            'Users are unable to login using their email and password credentials. The issue was first reported by QA during regression testing after the recent authentication middleware update (v2.1.3). When users attempt to login with valid credentials, the system responds with "Invalid credentials" error message, even though the same credentials work in the previous version. The bug affects 100% of users across all browsers (Chrome, Firefox, Safari, Edge) and devices (desktop, mobile, tablet). Initial investigation shows the issue occurs in the validatePassword function where bcrypt comparison is returning false for valid password hashes. The problem appears to be related to the salt rounds configuration change in the recent security update. This is a critical P0 bug blocking all user access to the system. Reproduction steps: 1) Navigate to login page, 2) Enter valid email and password, 3) Click login button, 4) Observe error message. Expected: User should be logged in successfully. Actual: Error message "Invalid credentials" is displayed.',
            1, // assigned_developer (Papapp)
            4, // assigned_tester (Charlie)
            'open'
        ],
        [
            'Implement Dark Mode Feature',
            'Product management has requested implementation of a dark mode toggle feature based on user feedback and market research showing 78% of users prefer dark interfaces for extended usage periods. The feature was discovered to be needed after user interviews revealed eye strain complaints during night-time usage sessions. This enhancement should include a comprehensive theming system with CSS custom properties (variables) for colors, a toggle switch in the application header with moon/sun icons, persistence of user preference in localStorage to maintain state across browser sessions, and smooth transitions between light and dark themes. The dark mode should cover all application pages including dashboard, issue list, issue detail, create/edit forms, user management, and login/register pages. Technical requirements include updating the existing CSS framework to use CSS variables instead of hardcoded colors, implementing a theme context in React for state management, adding animation transitions (0.3s ease) for theme switching, ensuring WCAG 2.1 AA accessibility compliance with contrast ratios, and testing across all supported browsers and devices. The feature should also include a system preference detection option to automatically set the initial theme based on user\'s OS settings using prefers-color-scheme media query.',
            3, // assigned_developer (Bob)
            6, // assigned_tester (Eve)
            'in_progress'
        ],
        [
            'Database Performance Issue',
            'Critical performance degradation identified in the issues list page when the database contains more than 100 issue records. The problem was discovered during load testing with a dataset of 500+ issues, where page load times increased from 200ms to over 8 seconds. Users reported timeouts and browser freezing when navigating to the issues list. Database query analysis revealed the main bottleneck is in the getAllIssues query which performs multiple JOIN operations without proper indexing. The query fetches all issues with user information using LEFT JOIN on the users table, but lacks indexes on the foreign key relationships. Additionally, the query retrieves all columns and all rows without pagination, causing memory issues on both server and client sides. The issue is more pronounced on production servers with limited memory (2GB RAM) compared to development environments. Performance monitoring shows CPU usage spikes to 95% and database connection pool exhaustion during peak usage hours. Affected queries include: SELECT i.*, u.name as assigned_to_name FROM issues i LEFT JOIN users u ON i.assigned_to = u.id ORDER BY i.created_at DESC. Proposed solutions include adding database indexes on issues.assigned_to and issues.created_at columns, implementing pagination with LIMIT and OFFSET, adding query result caching with Redis, optimizing the JOIN query structure, and implementing lazy loading for non-critical data.',
            5, // assigned_developer (Diana)
            null, // no tester assigned yet
            'open'
        ],
        [
            'Mobile Responsive Design',
            'The application lacks proper responsive design implementation, causing significant usability issues on mobile devices and tablets. The problem was identified during cross-device testing using Chrome DevTools and real device testing on iPhone 12, Samsung Galaxy S21, and iPad Pro. Specific issues include: navigation menu overlapping main content area on screen widths below 768px, form input fields extending beyond viewport width causing horizontal scrolling, buttons being too small for touch interaction (smaller than the recommended 44px minimum touch target), text content overflowing containers on smaller screens, and modal dialogs not fitting properly on mobile viewports. The issue affects user experience significantly as mobile traffic accounts for 65% of total application usage according to Google Analytics. Users report difficulty navigating the app on mobile devices, with 23% higher bounce rates on mobile compared to desktop. The root cause is the lack of responsive CSS media queries and the use of fixed pixel widths instead of flexible units. Current layout uses fixed widths (px) instead of responsive units (rem, %, vw/vh), no CSS Grid or Flexbox implementation for dynamic layouts, missing viewport meta tag optimization, and no consideration for touch-based interactions. The fix requires implementing CSS media queries for breakpoints at 480px, 768px, 1024px, and 1200px, converting fixed layouts to flexible CSS Grid and Flexbox systems, optimizing touch targets for mobile interaction, and ensuring proper viewport scaling configuration.',
            null, // no developer assigned yet
            4, // assigned_tester (Charlie)
            'open'
        ],
        [
            'Real-time Notifications System',
            'Product requirements specify implementation of a comprehensive real-time notification system to improve user engagement and workflow efficiency. The need was identified through user research showing that team members often miss important updates about issue assignments and status changes, leading to delayed responses and decreased productivity. Current workflow requires users to manually refresh pages or check email to discover updates, causing an average delay of 2-4 hours in response times. The notification system should leverage WebSocket technology for instant bidirectional communication between server and clients. Technical requirements include: real-time notifications when users are assigned new issues, instant alerts when issues they created or are assigned to are updated (status changes, comments, reassignments), toast notifications within the application interface, optional email notifications for users who prefer email alerts, notification persistence and history for offline users, notification preferences management allowing users to customize which events trigger notifications, and unread notification counters in the application header. The implementation should use Socket.IO for WebSocket management, integrate with the existing authentication system to ensure secure connections, implement notification queuing for offline users, add database tables for notification storage and user preferences, and include email integration with services like SendGrid or AWS SES. Additional features should include notification grouping (e.g., "5 issues assigned to you"), notification sound options, desktop browser notifications using the Notifications API, and mobile push notifications for future mobile app development. The system must handle high concurrency with proper connection management and graceful degradation when WebSocket connections fail.',
            3, // assigned_developer (Bob)
            6, // assigned_tester (Eve)
            'open'
        ]
    ];

    for (const [title, description, assigned_developer, assigned_tester, status] of issues) {
        await db.query(
            `INSERT INTO issues (title, description, assigned_developer, assigned_tester, status) VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT DO NOTHING`,
            [title, description, assigned_developer, assigned_tester, status]
        );
    }

    console.log('✅ Sample issues seeded with RBAC assignments');
}

module.exports = seedIssues;
