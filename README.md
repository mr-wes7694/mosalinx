# Mosalinx

Mosalinx is a cloud-based collaborative platform designed to bring creative teams, their projects, and their ideas together in one unified environment.

Creative projects often become fragmented across multiple tools for project management, communication, file storage, brainstorming, and progress tracking. Mosalinx aims to reduce that fragmentation by providing creators with a central Project Workspace where they can organize their work, collaborate with team members, manage resources, communicate, and develop ideas without constantly switching between applications.

The name **Mosalinx** combines **Mosaic** and **Links**, representing the idea of connecting many individual pieces, people, resources, and ideas into a larger creative whole.

---

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Repository Structure](#repository-structure)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Environment Configuration](#environment-configuration)
- [Development Preparation](#development-preparation)
- [Git Workflow](#git-workflow)
- [Contributors](#contributors)
- [Project Status](#project-status)
- [License](#license)
- [About the Project](#about-the-project)

---

## Features

Mosalinx is being developed around a set of integrated collaboration and project-management tools for independent creators and small creative teams. The features below represent the project's planned functionality and are being implemented incrementally throughout development.

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

### Analytics
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
- Express

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

## Installation and Setup

### End-User Installation

Mosalinx is currently in active development and is not yet available as a production release or end-user installation.

The setup instructions below are intended for developers and contributors who want to run the current development build locally.

### Developer Setup

#### Prerequisites

Before setting up Mosalinx, install:

- Git
- Node.js and npm
- MySQL Server
- MySQL Workbench or another MySQL client

Additional configuration is required for services such as Firebase Authentication. Other environment variables may be added as additional integrations are implemented.

#### Clone the Repository

```bash
git clone https://github.com/mr-wes7694/mosalinx.git
cd mosalinx
```

#### Frontend Setup

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

#### Backend Setup

From the project root, navigate to the backend directory:

```bash
cd backend
```

Install the backend dependencies:

```bash
npm install
```

Start the Express backend:

```bash
node server.js
```

The backend verifies the local MySQL database connection during startup and runs on the port configured in the backend environment variables.

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

Additional environment variables may be added as Firebase, OpenAI, file storage, and other integrations continue to be implemented.

> **Important:** Never commit `.env` files, passwords, API keys, authentication secrets, or other sensitive credentials to source control.

---

## Development Preparation

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

After completing the local developer setup, ensure the required dependencies and environment configuration for the area of the application being developed are current.

Before beginning development, verify that:

- The repository is up to date
- Required dependencies are installed
- Local environment variables are configured
- MySQL is running when database functionality is required
- The `mosalinx_dev` database has been created and configured
- Sensitive credentials are excluded from source control

---

## Git Workflow

Mosalinx uses a feature-branch workflow to manage changes from development through review and integration into the `main` branch.

1. Pull the latest version of `main`.
2. Create a new branch for the feature, task, fix, or documentation update.
3. Make and test changes on that branch.
4. Commit changes using descriptive commit messages.
5. Push the branch to GitHub.
6. Open a pull request into `main`.
7. Review and verify the changes through the pull request before merging.
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

### Veronica Johnson
**Project Planning, Database, Integration, and Documentation**

- Project planning, sprint organization, and Jira management
- Database schema design and MySQL configuration
- Development environment and repository documentation
- Authentication and application integration
- Testing and integration support
- Project documentation and README maintenance
- Mosalinx branding direction and original logo concept

### Wesley Filion
**Frontend Development and UI/UX**

- Frontend application development with React and Vite
- UI implementation and application navigation
- Login, registration, and dashboard interface development
- Figma prototyping and interface design
- Frontend authentication integration
- General frontend development and testing
- Logo refinement and frontend brand implementation

### Lesly Martinez
**Backend Development and Mascot Design**

- Node.js and Express backend development
- Backend routes, controllers, and application logic
- Database/backend integration
- User and authentication-related backend functionality
- Mosi mascot and character design
- Analytics interface concepts and visual design support

Mosalinx is being developed as part of the Full Sail University Bachelor of Science in Computer Science Capstone Project.

---

## Project Status

**Status: Active Development / Pre-Alpha**

Mosalinx is currently under active development. The project has progressed from its initial planning and design phase into implementation and integration of its core application foundation.

Current development includes:

- React / Vite frontend foundation and application routing
- Node.js / Express backend foundation
- MySQL database schema and local database connectivity
- Environment and development configuration
- Firebase Authentication foundation and authentication state management
- Protected application routing
- Login, registration, and dashboard interface development
- Resource management and file-storage integration
- Ongoing integration and testing

Features and documentation will continue to evolve as development progresses.

---

## License

This project is licensed under the **MIT License**. See the repository's [`LICENSE`](LICENSE) file for the full license terms.

---

## About the Project

Mosalinx was created for the Full Sail University Computer Science Capstone Project.

The long-term vision is to provide independent creators and small creative teams with a connected environment where project organization, collaboration, resources, communication, and creative ideation can exist together rather than across a collection of disconnected tools.