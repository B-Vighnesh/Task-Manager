# Task Manager API

Spring Boot backend with JWT authentication, role-based access, task CRUD APIs, Swagger documentation, and a Postman collection. A simple React frontend is included for testing the API from the browser.

## Tech Stack

- Java 21
- Spring Boot 4
- Spring Security
- Spring Data JPA
- MySQL
- JWT
- Swagger/OpenAPI with Springdoc
- React + Vite frontend

## Backend Features

- User registration and login
- BCrypt password hashing
- JWT authentication
- Role-based access for `USER` and `ADMIN`
- Versioned REST APIs
- Task CRUD for authenticated users
- Admin read-only endpoint to view all tasks
- Validation and global error handling
- Swagger UI and Postman API documentation

## Project Structure

```text
backend/
  src/main/java/backend/
    config/
    controller/
    dto/
    entities/
    exception/
    repository/
    security/
    service/
  postman_collection.json
frontend/
  src/
README.md
```

## Backend Setup

1. Create a MySQL database:

```sql
CREATE DATABASE task_manager;
```

2. Set environment variables:

```bash
DB_URL=jdbc:mysql://localhost:3306/task_manager
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
JWT_SECRET=your_long_secret_key_at_least_32_characters
```

3. Run the backend:

```bash
cd backend
mvn spring-boot:run
```

Backend runs at:

```text
http://localhost:8080
```

## API Documentation

Swagger UI:

```text
http://localhost:8080/swagger-ui.html
```

OpenAPI JSON:

```text
http://localhost:8080/v3/api-docs
```

Postman collection:

```text
backend/postman_collection.json
```

Import this file into Postman, run `Register` or `Login`, then the collection stores the JWT token automatically for protected task APIs.

## Main API Endpoints

### Auth

```text
POST /api/auth/v1/register
POST /api/auth/v1/login
```

### User Task APIs

Requires:

```text
Authorization: Bearer <token>
```

```text
GET    /api/v1/tasks
GET    /api/v1/tasks/{id}
POST   /api/v1/tasks
PUT    /api/v1/tasks/{id}
DELETE /api/v1/tasks/{id}
```

### Admin APIs

Requires an `ADMIN` JWT:

```text
GET /api/v1/tasks/admin
```

The admin endpoint is read-only and returns all tasks with the task owner's username.

## Example Register Body

```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "Password123"
}
```

## Example Task Body

```json
{
  "title": "Finish API docs",
  "description": "Add Swagger and Postman documentation",
  "completed": false
}
```

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

## GitHub Hosting

This repository already has a GitHub remote configured:

```text
https://github.com/B-Vighnesh/Task-Manager.git
```

To publish the latest work:

```bash
git add .
git commit -m "Add API documentation and project README"
git push origin main
```

If your branch is not `main`, check it with:

```bash
git branch --show-current
```

and push that branch instead.

## Notes

- Restart the backend after changing dependencies or environment variables.
- Swagger and Postman are both available for API testing.
- Tests may require valid database environment variables because the app starts a MySQL-backed Spring context.
