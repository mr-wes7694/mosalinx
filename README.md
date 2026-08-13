# Mosalinx

Mosalinx is a cloud-based collaborative platform designed to bring creative teams, their projects, and their ideas together in one unified environment.

Creative projects often become fragmented across multiple tools for project management, communication, file storage, brainstorming, and progress tracking. Mosalinx aims to reduce that fragmentation by providing creators with a central Project Workspace where they can organize their work, collaborate with team members, manage resources, communicate, and develop ideas without constantly switching between applications.

The name **Mosalinx** combines **Mosaic** and **Links**, representing the idea of connecting many individual pieces, people, resources, and ideas into a larger creative whole.

---

## Features

Mosalinx is being developed around a set of integrated collaboration and project-management tools for independent creators and small creative teams.

### Project Management
- Create and manage projects
- Organize work within dedicated Project Workspaces
- Invite collaborators and manage project membership
- Track project activity and progress

### Team Collaboration
- Communicate with team members through workspace posts
- Keep project-related communication connected to the project
- View recent project activity from a centralized dashboard

### Resource Management
- Upload and organize project files and resources
- Categorize resources for easier navigation
- Keep creative assets accessible to project collaborators

### AI-Assisted Brainstorming
- Generate ideas with AI assistance
- Support creative brainstorming and content development
- Save useful ideas within the project workflow

### Planned Analytics
- Provide visibility into project activity and progress
- Help teams understand how their projects are developing over time

---

## Technology Stack

### Frontend
- React
- Vite
- JavaScript

### Backend
- Node.js
- Express.js

### Database
- MySQL

### Authentication
- Firebase Authentication

### File Storage
- Firebase Cloud Storage

### AI Integration
- OpenAI API

### Development and Collaboration
- Git
- GitHub
- Jira
- Figma

---

## Repository Structure

```text
Mosalinx/
│
├── backend/           # Node.js / Express backend application
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── utils/
│
├── database/          # Database schema, migrations, backups, and seed data
│   ├── backups/
│   ├── migrations/
│   ├── schemas/
│   └── seeds/
│
├── deployment/        # Deployment configuration and scripts
├── documentation/     # Project documentation and design artifacts
├── frontend/          # React / Vite frontend application
├── testing/           # Unit, integration, and test resources
│
├── .gitignore
├── LICENSE
└── README.md
```

---

## Installation

> **Note:** Mosalinx is currently under active development and is not yet available as a production release. These instructions are intended for running the current development build locally.

### Prerequisites

Before setting up Mosalinx, install:

- Git
- Node.js and npm
- MySQL Server
- MySQL Workbench or another MySQL client

Additional configuration may be required as Firebase and OpenAI integrations are implemented.

### Clone the Repository

```bash
git clone https://github.com/mr-wes7694/mosalinx.git
cd mosalinx
```

### Frontend Setup

Navigate to the frontend directory:

```bash
cd frontend
```

Install the project dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

### Backend Setup

From the project root, navigate to the backend directory:

```bash
cd backend
```

Install the backend dependencies:

```bash
npm install
```

Backend startup instructions will be updated as the Express application foundation is completed.

---

## Database Setup

Mosalinx uses MySQL for relational application data.

The current database schema is located at:

```text
database/schemas/schema.sql
```

Create a local development database named:

```text
mosalinx_dev
```

Then execute `schema.sql` against the development database to create the required tables and relationships.

Local database credentials should never be committed to the repository.

---

## Environment Configuration

Environment-specific configuration is stored locally using `.env` files.

An example backend configuration is provided at:

```text
backend/.env.example
```

Create your local configuration by copying the example file:

```bash
cd backend
cp .env.example .env
```

Update the values in `.env` for your local development environment.

Example:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=mosalinx_dev
DB_USER=mosalinx_dev
DB_PASSWORD=your_local_database_password
```

Additional environment variables will be added as authentication, Firebase, OpenAI, and other integrations are implemented.

> **Important:** Never commit `.env` files, passwords, API keys, authentication secrets, or other sensitive credentials to source control.

---

## Development Setup

New contributors should begin from the latest version of the `main` branch.

```bash
git checkout main
git pull origin main
```

Create a dedicated branch for the task or feature being developed:

```bash
git checkout -b feature/your-feature-name
```

Documentation-only work may use a documentation branch:

```bash
git checkout -b docs/your-documentation-update
```

Install the required dependencies for the area of the application being developed and configure any necessary local environment variables.

Before beginning development, verify that:

- The repository is up to date
- Required dependencies are installed
- Local environment variables are configured
- MySQL is running when database functionality is required
- The `mosalinx_dev` database has been created and configured
- Sensitive credentials are excluded from source control

---

## Git Workflow

Mosalinx uses a feature-branch workflow to keep development work isolated and the `main` branch stable.

1. Pull the latest version of `main`.
2. Create a new branch for the feature, task, fix, or documentation update.
3. Make and test changes on that branch.
4. Commit changes using descriptive commit messages.
5. Push the branch to GitHub.
6. Open a pull request into `main`.
7. Review and verify the changes before merging.
8. Begin new work from the newly updated `main` branch.

Example:

```bash
git checkout main
git pull origin main
git checkout -b feature/example-feature
```

This workflow allows team members to work independently while reducing conflicts between active development tasks.

---

## Contributors

- Veronica Johnson
- Wesley Filion
- Lesly Martinez

Mosalinx is being developed as part of the Full Sail University Bachelor of Science in Computer Science Capstone Project.

---

## Project Status

**Status: Active Development / Pre-Alpha**

Mosalinx is currently under active development. The project has moved from initial planning and design into implementation of its core application foundation.

Current development includes:

- React / Vite frontend foundation
- Node.js / Express backend foundation
- MySQL database implementation
- Environment and development configuration
- Authentication integration
- Core dashboard and Project Workspace functionality
- Integration and testing

Features and documentation may change as development continues.

---

## License

This project is licensed under the terms provided in the repository's [`LICENSE`](LICENSE) file.

---

## About the Project

Mosalinx was created for the Full Sail University Computer Science Capstone Project.

The long-term vision is to provide independent creators and small creative teams with a connected environment where project organization, collaboration, resources, communication, and creative ideation can exist together rather than across a collection of disconnected tools.