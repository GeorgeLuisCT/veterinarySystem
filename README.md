# 🐾 Veterinary System

A comprehensive, modern full-stack application designed for managing veterinary clinics. This system provides a robust backend for data management and a polished, responsive frontend for user interaction, orchestrated efficiently using Docker.

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
- **Framework**: [Spring Boot 2.7](https://spring.io/projects/spring-boot)
- **Language**: Java 17
- **Database**: PostgreSQL 15
- **API Standards**: REST & GraphQL
- **Security**: Spring Security with JWT (JSON Web Tokens)
- **ORM**: Spring Data JPA

### 🏗️ Infrastructure & DevOps
- **Containerization**: Docker & Docker Compose
- **Web Server / Gateway**: Nginx
- **Build Tools**: Maven (Backend), npm (Frontend)

---

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:
- [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)
- **Git**

*(Optional for local non-Docker development)*
- Java JDK 17
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
# Use a strong secret key for production!
JWT_SECRET=YourSuperLongAndSecretKeyForSigningTokens123456
JWT_EXPIRATION=86400000 # 24 hours in milliseconds
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

---

## 📂 Project Structure

```plaintext
veterinarySystem/
├── docker-compose.yml       # Docker services orchestration
├── .env                     # Environment variables (Create this!)
├── nginx/                   # Nginx gateway configuration
├── veterinarySystemRest/    # Spring Boot Backend Source
│   ├── src/                 # Java source code
│   ├── pom.xml              # Maven dependencies
│   └── Dockerfile
└── veterinarysystemfront/   # Next.js Frontend Source
    ├── src/                 # React/Next.js source code
    ├── package.json         # NPM dependencies
    └── Dockerfile
```

