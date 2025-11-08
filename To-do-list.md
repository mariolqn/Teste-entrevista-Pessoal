1. Initialize monorepo structure with pnpm workspaces, configure TypeScript, ESLint, Prettier
2. Setup MySQL with Docker Compose, create Prisma schema with all tables and indexes
3. Create seed script with data matching the dashboard screenshot values (Revenue: 41,954.26, Expense: 67,740.79)
4. Setup Fastify server with middleware (CORS, rate limiting, helmet, validation)
5. Implement dynamic /api/v1/charts/:type endpoint with strategy pattern for different chart types
6. Implement /api/v1/options/:entity endpoint with cursor-based pagination for infinite scroll
7. Implement /api/v1/dashboard/summary endpoint for KPI cards data
8. Add Redis caching layer with ETag support for API responses
9. Create OpenAPI documentation with Swagger Ul for all endpoints
10. Write comprehensive unit and integration tests for backend (>90% coverage)
11. Setup React with Vite, TypeScript, Tailwind CSS, and configure TanStack Query
12. Create dashboard layout matching the provided screenshot with KPI cards and chart sections
13. Implement InfiniteScrollSelect component with intersection observer for dynamic loading
14. Implement dynamic chart components (line, bar, pie, table) with Recharts
15. Implement mandatory date range picker that filters all dashboard data
16. Write unit and component tests for frontend (>80% coverage)
17. Create E2E tests with Playwright for critical user flows
18. Create production-ready Dockerfiles for both API and web applications
19. Setup GitHub Actions CI/CD pipeline with tests, security scans, and build steps
20. Write comprehensive README with setup instructions, architecture
diagrams, and API examples