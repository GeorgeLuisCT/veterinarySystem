# Repository Guidelines

## Project Structure & Module Organization
`biocampovet/` hosts the Next.js front end: App Router pages in `src/app`, shared UI in `src/components`, utilities in `src/context|hooks|services`, Tailwind setup in `src/styles`/`tailwind.config.js`, and dashboards under `src/app/dashboard/<domain>/services|types`. `BiocampoVetRest/` houses the Spring Boot API with `core/<feature>/controller|service|repository|dto|mapper` packages plus shared code in `core/global/`, `config/`, and `security/`.

## Build, Test, and Development Commands
- Front end: `cd biocampovet && npm run dev`; bundle with `npm run build && npm run start`; lint via `npm run lint`.
- Back end: `cd BiocampoVetRest && ./mvnw spring-boot:run`; package with `./mvnw clean package`; run tests using `./mvnw test`.

## Coding Style & Naming Conventions
Prettier (2 spaces, single quotes) and ESLint guard the front end; components are PascalCase, hooks camelCase, constants UPPER_SNAKE_CASE. Java keeps Spring formatting (4 spaces) with constructor injection, `Controller`/`Service` suffixes, repositories extending `JpaRepository`, and prefers `@RequiredArgsConstructor`.

## Frontend Component & State Patterns
Client components start with `"use client"`, import via `@/` aliases, wrap shadcn/ui primitives, and pull API helpers from feature `services/` built on `src/services/api.tsx`. Types live under `types/`, service methods return typed promises, and Zod schemas (for example `branchActivationInputSchema`) keep inputs, hooks, and services aligned.

## Backend Controller & Service Conventions
Controllers map to `/api/...`, return `ResponseEntity<DTO>`, read auth context from `JwtTokenProvider`, and guard privileged paths with `@PreAuthorize` or `@BranchAccessRequired` (enforced by `BranchAccessAspect`). Services encapsulate business rules, inject repositories via constructors, mark read-only flows with `@Transactional(readOnly = true)`, and assemble DTOs with mappers or private converters.

## Request & Response Data Patterns
Frontend payloads mirror Zod types reused from feature `types/`. Backend DTOs use Lombok with validation while responses prefer builders or records plus `PaginatedResponse<T>`; entities mirror tables, lazy-load relations, and rely on `GlobalExceptionHandler`.

## Testing Guidelines
Backend additions require JUnit 5 controller and service tests seeded with `db/BasicData.sql` or targeted `@Sql`. Frontend changes that affect flows should add Vitest or Playwright coverage and must finish with `npm run lint`.

## Collaboration & Review Expectations
When naming or shaping data, inspect a similar module to mirror the established pattern. Backend edits must trigger a review of the corresponding frontend services and types, and frontend edits must verify backend contracts or security rules. Commits stay concise and imperative (Conventional Commit prefixes welcome), and pull requests document test evidence, linked issues, and cross-stack impacts.

## Environment & Configuration Notes
Frontend secrets belong in `biocampovet/.env.local`; backend credentials live in `application.properties`—override each via environment variables or ignored `*-local` files.
