# 🛡️ Veterinary System - Backend API

The RESTful and GraphQL API service for the Veterinary System. Built with Spring Boot, this application manages the business logic, database interactions, and authentication for the platform.

## 🚀 Technology Stack

- **Framework**: [Spring Boot 2.7](https://spring.io/projects/spring-boot)
- **Language**: Java 17
- **Database**: PostgreSQL 15
- **ORM**: Spring Data JPA
- **Security**: Spring Security (JWT Implementation)
- **API Standards**: REST & GraphQL
- **Build Tool**: Maven

## 🛠️ Prerequisites

- **Java JDK 17**
- **Maven** (optional if using `mvnw` wrapper)
- **PostgreSQL** instance (local or via Docker)

## ⚙️ Configuration

The application requires specific environment variables or `application.properties` settings to connect to the database.

**Environment Variables:**
```bash
DB_HOST=localhost       # Or 'database' if running in Docker
DB_PORT=5432
DB_NAME=veterinary_db
DB_USERNAME=postgres
DB_PASSWORD=your_password
JWT_SECRET=YourSecretKey
JWT_EXPIRATION=86400000
```

## 🏁 Getting Started (Local Development)

### 1. Database Setup
Ensure your PostgreSQL database is running and the database (e.g., `veterinary_db`) exists.

### 2. Build and Run
You can run the application directly using the Maven wrapper:

```bash
# Windows
./mvnw.cmd spring-boot:run

# Linux/Mac
./mvnw spring-boot:run
```

The server will start on port `8080` (default).

## 🐳 Docker Support

To build the Docker image for this service specifically:

```bash
docker build -t veterinary-backend .
```

Or run it as part of the main `docker-compose` setup from the root directory.
