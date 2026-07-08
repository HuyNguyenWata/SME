# SME Backend System 🚀

## 📖 Overview

The SME Backend System is a comprehensive, scalable, and intelligent backend solution designed specifically for Small and Medium Enterprises (SMEs). It empowers businesses with robust product management, automated workflows, and AI-driven content generation capabilities to streamline operations and enhance productivity.

Built with modern web technologies, this system is optimized for performance, maintainability, and seamless deployment.

## ✨ Features Supported for SMEs

Our system provides a tailored suite of functionalities to help small and medium businesses thrive in the digital landscape:

- **📦 Product & Inventory Management:** Create, read, update, and manage products and categories efficiently.
- **🤖 AI Content Generation:** Deep integration with AI Core to auto-generate marketing materials, product descriptions, and conversational content.
- **🔄 Automated Workflows (N8N):** Trigger dynamic, automated business workflows via N8N webhooks, saving time on repetitive tasks.
- **💬 Chat & Conversations:** Built-in conversation management to handle customer interactions or internal AI prompts.
- **📰 RSS Feed Aggregation:** Monitor and fetch data from multiple RSS sources to keep content fresh and up-to-date.
- **☁️ Cloud Media Storage:** Direct integration with Cloudinary for seamless and optimized image/video management.
- **🔐 Secure Authentication:** JWT-based authentication with role-based access control (RBAC) to ensure your enterprise data is kept secure.

## 🛠 Tech Stack

The architecture is built on a highly reliable and modern stack:

- **Framework:** [NestJS](https://nestjs.com/) (Node.js) - Providing a scalable, object-oriented structure.
- **Database:** PostgreSQL - A powerful, open-source object-relational database.
- **ORM:** [Prisma](https://www.prisma.io/) - Next-generation Node.js and TypeScript ORM for type-safe database access.
- **Containerization:** Docker & Docker Compose - Ensuring consistent environments from development to production.
- **Others:** JWT/Passport for Auth, Cloudinary for media, N8N for workflow automation.

## 🚀 Setup & Tutorial (How to run)

### Prerequisites

- Node.js (v20+ recommended)
- Docker & Docker Compose
- PostgreSQL (if not using Docker)

### 1. Environment Configuration

Clone the repository and set up your environment variables:

```bash
cp .env.example .env
```

Open the `.env` file and configure the required variables. Example:

```env
# Database configuration
DATABASE_URL="postgresql://postgres:password@sme_db:5432/smedb?schema=public"

# App & Security
PORT=3000
JWT_SECRET="your-super-secret-key"

# Integrations
CLOUDINARY_CLOUD_NAME="your_cloud_name"
AI_CORE_URL="http://localhost:8000"
N8N_URL="your-n8n-url"
```

### 2. Running via Docker Compose (Recommended)

The easiest way to run the NestJS API is using Docker Compose. We have provided a heavily optimized multi-stage Dockerfile.

Just run the following command in the root directory:

```bash
docker compose up -d --build
```

- The **NestJS API** will start on port `3000`.
- Your database is hosted externally, so ensure `DATABASE_URL` in `.env` is correct.

To stop the system:

```bash
docker compose down
```

### 3. Running Locally (Development Mode)

If you prefer to run the application locally for active development:

1. **Ensure your external Postgres Database is running and accessible**.
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Generate Prisma Client & Push Schema:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```
4. **Start the NestJS server:**
   ```bash
   npm run start:dev
   ```

The API will be available at `http://localhost:3000`.

---

_For the original NestJS boilerplate documentation, please refer to [nestjs_readme.md](./nestjs_readme.md)._
