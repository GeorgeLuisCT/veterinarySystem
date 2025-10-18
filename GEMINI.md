# GEMINI.md

## Project Overview

This repository, "BiocampoVet", is a monorepo containing the source code for a veterinary management system. The project is split into two main parts:

1.  **`BiocampoVetRest` (Backend):** A RESTful API service built with Java and the Spring Boot framework. It handles the business logic, data persistence, and security.
2.  **`biocampovet` (Frontend):** A modern web application built with Next.js, React, and TypeScript. It provides the user interface for interacting with the backend service.

The database used is PostgreSQL, as indicated by the backend dependencies.

---

## Backend (`BiocampoVetRest`)

The backend is a standard Java Spring Boot application managed with Maven.

### Building the Backend

To build the backend, navigate to the `BiocampoVetRest` directory and run the Maven package command. This will compile the code and package it into a `.jar` file in the `target` directory.

```bash
cd BiocampoVetRest
mvn package
```

### Running the Backend

You can run the backend application directly using the Spring Boot Maven plugin. This will start the server, typically on port 8080.

```bash
cd BiocampoVetRest
mvn spring-boot:run
```

### Backend Dependencies

-   Spring Boot (Web, Data JPA, Security)
-   PostgreSQL JDBC Driver
-   Lombok
-   JSON Web Tokens (jjwt)

---

## Frontend (`biocampovet`)

The frontend is a Next.js application written in TypeScript.

### Installing Frontend Dependencies

Before running the frontend for the first time, you need to install the Node.js dependencies listed in `package.json`.

```bash
cd biocampovet
npm install
```

### Running the Frontend in Development Mode

To run the frontend in a development environment with hot-reloading, use the `dev` script.

```bash
cd biocampovet
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Building the Frontend for Production

To create a production-ready build of the frontend, use the `build` script.

```bash
cd biocampovet
npm run build
```

### Running the Frontend in Production Mode

After building, you can start the production server using the `start` script.

```bash
cd biocampovet
npm run start
```

### Development Conventions

-   **Linting:** The project uses ESLint for code quality. You can run the linter with `npm run lint`.
-   **Styling:** The project uses Tailwind CSS for styling, along with Radix UI components for accessible UI primitives.

### Convenciones Críticas de Desarrollo y Arquitectura

El agente de IA (Gemini) debe adherirse estrictamente a las siguientes normas de nomenclatura, estructura y reutilización de componentes, actuando como un miembro experimentado del equipo. La coherencia del proyecto es crítica y la inferencia de patrones es obligatoria.

1. Coherencia y Nomenclatura del Backend (BiocampoVetRest)

Regla de Coherencia de Nombres (Naming Inference - CRÍTICO):

El agente debe analizar los archivos existentes (ej. en los paquetes request y response o mappers) para inferir el patrón de nomenclatura exacto utilizado para los objetos de transferencia de datos.

Prohibido usar DTO genérico. La nomenclatura debe ser {Entidad}Request.java y {Entidad}Response.java o, si el proyecto lo prefiere, Use{Entidad}Request.java o Service{Entidad}Request.java. El agente NO debe crear un patrón nuevo si ya existe uno.

Mappers y Estructura:

Siempre se deben usar clases Mapper para transformar entre entidades, solicitudes (Request) y respuestas (Response).

El mapper debe ser estático y residir en el mismo paquete que la entidad a la que mapea.

Validaciones y Endpoints:

Todas las validaciones deben seguir el patrón establecido en otros controllers (ej. uso de @Valid y clases de validación específicas).

Los endpoints deben respetar el pathing y los verbos HTTP utilizados en los controllers existentes.

Estructura de Respuestas (Normalización):

Cualquier respuesta, especialmente las que contienen validaciones o errores, debe seguir el mismo formato estructurado y serialización (ej. si se usa un wrapper o un formato de error estandarizado, debe replicarlo).

Tipos y Resúmenes (Summaries):

Si existen tipos de datos específicos para resúmenes (ej. un SummaryType.java o SummaryResponse.java), el agente debe crear nuevos tipos de resumen siguiendo esa misma convención.

2. Coherencia y Reutilización del Frontend (biocampovet)

Reutilización de Componentes (CRÍTICO):

Antes de crear cualquier componente nuevo (Tablas, Modales, Formularios, Botones o Layouts), el agente debe escanear el proyecto para verificar si un componente existente cubre o puede ser adaptado para la nueva funcionalidad.

Ejemplo: Si existe un CustomTable.tsx o un InputGroup.tsx, el agente debe utilizar y adaptar esos componentes en lugar de crear su propia versión.

Esquemas de Validación (Zod/TypeScript):

Si el proyecto utiliza esquemas de validación Zod, el agente debe agrupar, nombrar y estructurar los archivos de esquemas replicando el patrón encontrado.

Hooks Personalizados:

Si el proyecto utiliza hooks personalizados (ej. para fetching de datos o autenticación), el agente debe integrar y utilizar esos hooks en lugar de reescribir la lógica de gestión de estado o efectos.

Nomenclatura de Archivos y Agrupación:

La organización de archivos de componentes, estilos y hooks debe replicar el patrón de carpetas existente (ej. si los estilos de Tailwind personalizados se agrupan en un archivo, no deben ser inlined a menos que sea el patrón general).

### FORMA DE RESPONDER A LAS TAREAS QUES E ASIGNAN
1. siempre crea los archivos completos con la logica completa usando como referencia otros archivos de utilizacion similar

## Reglas para eliminacion de codigo
1. Verifica si el codigo a eliminar ya no es util y no se usa en otras partes
2. ELimina simpre y cuando esto cause errores
3. antes de cualquier elimiancion de algun dato en el frontedn verifca que no sea necesario en el backend
4. antes de cualquier eliminacion en el backend verifca que no sea necesario en el frontend


## Otras idicaciones 
1. Siempre al usar algun componenete o clase verifca que parametros necesita antes de usarlo



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

## Es de suma importancia ceñirse a las convenciones establecidas en el proyecto para ello tienes que revisar otros archvivos y vier la estrucra y no cambiar eso lo que progrma es la logica los puntos de entrada y salida pero se tiene que seguir estricutamente la estrcura del proyecto  es importante la manera en que se nombra los archivso, la manera en que se llama los metodos, la manera en que se llama las variables y la manera en que se llama las constantes tambien la forma en la que se crea los constructores ya inyecction de dependecias los directorios y la forma en que se llama los archivos

## Este no es un proyecto de escuela ni mucho menos una prueba ni un chiste este es un proyecto serio y completo y bien estructurado 

## sigue las convenicnetes las api si por ejemplo es necesario el prefijo /api/  o no ten en cuenta es 