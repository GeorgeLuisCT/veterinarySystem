# 🐾 Veterinary System

A comprehensive, modern full-stack application designed for managing veterinary clinics. This system provides a robust backend for data management and a polished, responsive frontend for user interaction, orchestrated efficiently using Docker.

It is **multi-tenant**: one deployment serves many clinics, each one isolated in **its own PostgreSQL schema** (`t_<slug>`).
Business tables have no `tenant_id` column. See [docs/adr/0001-multiempresa-por-schema.md](docs/adr/0001-multiempresa-por-schema.md).

## 🚀 Technology Stack

### 💻 Frontend (Client)
- **Framework**: [Next.js 15](https://nextjs.org/) (React)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) (Headless), [Lucide React](https://lucide.dev/) (Icons)
- **Forms & Validation**: React Hook Form, Zod
- **Data Fetching**: Axios
- **Visualization**: Recharts

### 🛡️ Backend (Server)
- **Framework**: [.NET 8](https://dotnet.microsoft.com/) — ASP.NET Core Minimal APIs
- **Language**: C# 12
- **Database**: PostgreSQL 15 (one schema per clinic)
- **ORM**: Entity Framework Core 8 + Npgsql (migrations applied to every clinic schema on startup)
- **API Standards**: REST & GraphQL (reports, [HotChocolate](https://chillicream.com/docs/hotchocolate))
- **Security**: JWT + BCrypt, role rules per route
- **Validation / Logging**: FluentValidation, Serilog

### 🏗️ Infrastructure & DevOps
- **Containerization**: Docker & Docker Compose
- **Web Server / Gateway**: Nginx
- **Build Tools**: dotnet CLI (Backend), npm (Frontend)

---

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:
- [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)
- **Git**

*(Optional for local non-Docker development)*
- .NET 8 SDK
- Node.js (LTS or Latest)

---

## 🏁 Getting Started

Follow these steps to get a local copy up and running.

### 1. Clone the Repository
```bash
git clone https://github.com/GeorgeLuisCT/veterinarySystem.git
cd veterinarySystem
```

### 2. Environment Configuration
Create a `.env` file in the root directory. This file manages your database credentials and security keys.

**Example `.env` file:**
```ini
# Database Configuration
POSTGRES_DB=veterinary_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password

# Application DB Connection (Must match above)
DB_NAME=veterinary_db
DB_USERNAME=postgres
DB_PASSWORD=your_secure_password

# Security (JWT)
# Use a strong secret key for production (base64 or plain text, at least 32 bytes)!
JWT_SECRET=YourSuperLongAndSecretKeyForSigningTokens123456
JWT_EXPIRATION=86400000 # 24 hours in milliseconds
CORS_ORIGINS=https://veterinarysystem.gaedet.com

# Platform super-admin (creates / suspends clinics). Created only if it does not exist yet.
PLATFORM_ADMIN_EMAIL=super@example.com
PLATFORM_ADMIN_PASSWORD=change-me-please-123

# Optional: first clinic, created on startup with its schema and admin user
BOOTSTRAP_TENANT_SLUG=coryvet
BOOTSTRAP_TENANT_NAME=Veterinaria Coryvet
BOOTSTRAP_ADMIN_USERNAME=admin
BOOTSTRAP_ADMIN_PASSWORD=a-strong-password-123
BOOTSTRAP_ADMIN_EMAIL=admin@example.com

# Optional: resolve the clinic from the subdomain (<slug>.TENANCY_BASE_DOMAIN)
TENANCY_BASE_DOMAIN=
```

### 3. Run with Docker 🐳
Build and launch the entire system (Database, Backend, Frontend, Nginx) with a single command:

```bash
docker-compose up -d --build
```
*Wait a few moments for the containers to initialize and the database to be ready.*

### 4. Access the Application
- **Web Interface**: `http://localhost` (Proxied via Nginx)
- **Backend API**: `http://localhost/api` (if configured in Nginx) or via internal networking.

### 5. Clinics (tenants)
Each clinic is identified by a short code (*slug*, e.g. `coryvet`):

- **Staff login**: type the clinic code in the *Empresa* field (it is remembered), or open `/login?empresa=coryvet`.
- **Public portal**: share `https://<host>/?empresa=coryvet`; the browser sends it as the `X-Tenant` header.
- With `TENANCY_BASE_DOMAIN` set, `coryvet.<domain>` works without any code; with a single active clinic nothing is needed.

Create more clinics with the platform API:

```bash
TOKEN=$(curl -s http://localhost/api/platform/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"super@example.com","password":"change-me-please-123"}' | jq -r .token)

curl http://localhost/api/platform/tenants -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{
  "slug": "patitas", "name": "Veterinaria Patitas", "industry": "Veterinaria",
  "adminUsername": "admin", "adminPassword": "another-strong-pass-1", "adminEmail": "admin@patitas.pe",
  "branchName": "Sede principal", "branchLocation": "Lima"
}'
```

### Backend development
```bash
cd backend
dotnet run --project src/VetSaas            # applies migrations to platform + every clinic schema
dotnet ef migrations add <Name> --project src/VetSaas --context TenantDbContext \
  -o Shared/Infrastructure/Persistence/Migrations/Tenant
```

---

## 📂 Project Structure

```plaintext
veterinarySystem/
├── docker-compose.yml       # Docker services orchestration
├── .env                     # Environment variables (Create this!)
├── nginx/                   # Nginx gateway configuration
├── docs/adr/                # Architecture decisions (multi-tenancy by schema)
├── backend/                 # .NET 8 Backend Source
│   ├── src/VetSaas/
│   │   ├── Modules/         # Platform, Users, Customers, Inventory, Finance, Sales, Clinic, Fieldwork, Reports, PublicPortal
│   │   └── Shared/          # Tenancy, persistence, security, validation, JSON
│   ├── VetSaas.sln
│   └── Dockerfile
└── veterinarysystemfront/   # Next.js Frontend Source
    ├── src/                 # React/Next.js source code
    ├── package.json         # NPM dependencies
    └── Dockerfile
```

