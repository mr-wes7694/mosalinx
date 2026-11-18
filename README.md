# Mosalinx

**A Collaborative Workspace for Creative Teams**

Mosalinx is a cloud-based collaboration platform designed to bring creative teams, their projects, and their ideas together in one unified environment.

Creative projects often become fragmented across multiple tools for project management, communication, file storage, brainstorming, and progress tracking. Mosalinx aims to reduce that fragmentation by providing creators with a central Project Workspace where they can organize their work, collaborate with team members, manage resources, and track project activity without constantly switching between applications.

Designed for writers, artists, worldbuilders, content creators, independent developers, and small creative teams, Mosalinx provides a shared environment where creative work can stay organized and connected.

The name **Mosalinx** combines **Mosaic** and **Links**, representing the idea of connecting many individual pieces, people, resources, and ideas into a larger creative whole.

## Live Application

**Access Mosalinx:** https://mosalinx.onrender.com/

Mosalinx is available as a deployed capstone application. Users can access the platform through a web browser, register an account, and explore its implemented collaboration and project-management features.

No local installation or development environment is required to use the hosted application.

---

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Repository Structure](#repository-structure)
- [Installation and Setup](#installation-and-setup)
  - [Getting Started for Users](#getting-started-for-users)
  - [Developer Setup](#developer-setup)
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

Mosalinx brings project organization, creative resources, and team collaboration together in a centralized workspace. The capstone implementation includes functional project-management and collaboration tools, alongside prototype interfaces demonstrating additional capabilities planned for future development.

### Implemented Features

**User Accounts and Profiles**
- Register and sign in securely using Firebase Authentication.
- Access authenticated areas of the application through protected routes.
- View and manage user profile information and account settings.
- Personalize user profiles with avatar images.

**Project Management**
- Create and manage projects within dedicated workspaces.
- Edit project information and manage existing projects.
- Invite registered Mosalinx users to collaborate on projects.
- Accept or decline project invitations.
- View project members and manage collaboration through project membership.
- Access project-related tools and resources from a centralized workspace.

**Dashboard and Activity Tracking**
- Navigate projects and application features from a centralized dashboard.
- Arrange dashboard tiles to personalize the workspace layout.
- View recent project activity and updates.
- Track supported workspace actions through the activity feed.

**Resource Management**
- Upload project resources using Firebase Cloud Storage.
- Organize resources into categories.
- Search and browse available project resources.
- Access and manage uploaded files within the appropriate project context.

**Workspace Files**
- Create and organize workspace files and folders.
- Work with supported document, spreadsheet, presentation, and code file types.
- Rename and manage workspace files.
- Use integrated file-editing interfaces to work on project content.

**Team Collaboration**
- Share project-related information through workspace posts.
- View posts and activity within the project workspace.
- Access project membership information.
- Keep project communication and resources connected to their respective workspaces.

**Calendar and Scheduling**
- View project calendar events.
- Create and manage scheduled events.
- Organize project activities using the integrated calendar interface.

### Prototype Features

The following interfaces were developed to demonstrate additional capabilities but are not fully connected to persistent application data.

**Team Messaging**
- A messaging interface demonstrates conversations and team communication.
- The current prototype uses demonstration data rather than persistent backend messaging.

**Project Statistics**
- A statistics dashboard demonstrates project summaries, task information, and team workload visualization.
- Statistics currently use sample data rather than live project analytics.

### Planned Enhancements

The following capabilities are part of the broader Mosalinx vision and were not completed as functional features during the capstone implementation.

**Mosi AI Assistant**
- AI-assisted brainstorming and creative idea generation.
- Contextual suggestions to support creative development.
- Integration of AI-generated ideas into project workflows.

**Expanded Collaboration and Analytics**
- Persistent team messaging.
- Live project statistics and reporting.
- Additional collaboration and project-management capabilities.
- Real-time collaborative editing.

These enhancements represent opportunities for continued development beyond the initial capstone implementation.

---

## Technology Stack

Mosalinx uses a full-stack JavaScript architecture supported by cloud-based authentication, file storage, database hosting, and application deployment services.

### Frontend
- **React:** Component-based user interface development.
- **Vite:** Frontend development tooling and build system.
- **JavaScript:** Application functionality and frontend logic.
- **CSS:** Interface styling and responsive layouts.

### Backend
- **Node.js:** JavaScript runtime for server-side functionality.
- **Express.js:** REST API development and backend routing.
- **Firebase Admin SDK:** Server-side Firebase Authentication integration and authenticated request verification.

### Database
- **MySQL:** Relational database for application data, projects, memberships, resources, and related records.
- **Aiven:** Cloud hosting for the MySQL database.

### Authentication and File Storage
- **Firebase Authentication:** User registration, sign-in, and authentication management.
- **Cloud Storage for Firebase:** Cloud-based storage for uploaded resources and supported workspace files.

### Deployment
- **Render:** Hosting for the deployed Mosalinx application.

### Development and Collaboration
- **Git and GitHub:** Version control, pull requests, and code reviews.
- **Jira:** Agile project planning, sprint management, and development tracking.
- **Figma:** Interface prototyping, design references, and project diagrams.
- **Visual Studio Code:** Source code editing and development.

### Future Integrations
- **OpenAI API:** Planned integration for Mosi, the proposed AI-assisted brainstorming feature. This integration was not implemented in the capstone release.

---

## Repository Structure

Mosalinx is organized into separate frontend, backend, database, documentation, deployment, and testing directories to support modular development and team collaboration.

```text
Mosalinx/
│
├── backend/                  # Node.js / Express backend
│   ├── config/               # Database, Firebase Admin, and application configuration
│   ├── controllers/          # API request handling and application logic
│   ├── middleware/           # Authentication, logging, and request middleware
│   ├── models/               # Database queries and data access
│   ├── routes/               # REST API endpoints
│   ├── services/             # Shared backend services
│   ├── tests/                # Automated backend tests
│   ├── utils/                # Backend utility functions
│   ├── .env.example          # Backend environment configuration template
│   └── server.js             # Backend application entry point
│
├── database/                 # MySQL database resources
│   ├── backups/              # Reserved for database backups
│   ├── migrations/           # Database schema updates
│   ├── schemas/              # Main database schema
│   └── seeds/                # Reserved for seed data
│
├── deployment/               # Deployment directory structure
│   ├── config/
│   ├── development/
│   ├── production/
│   ├── scripts/
│   └── staging/
│
├── documentation/            # Technical and project documentation
│   ├── api-reference/
│   ├── design-doc/
│   ├── development/
│   ├── erd/
│   ├── planning/
│   ├── ui-mockups/
│   └── user-guide/
│
├── frontend/                 # React / Vite frontend
│   ├── public/               # Static frontend assets
│   ├── src/
│   │   ├── assets/           # Application assets
│   │   ├── components/       # Reusable interface components
│   │   ├── config/           # Frontend configuration
│   │   ├── context/          # Authentication and project contexts
│   │   ├── data/             # Dashboard and prototype sample data
│   │   ├── hooks/            # Custom React hooks
│   │   ├── pages/            # Application pages and views
│   │   ├── services/         # Frontend API and application services
│   │   └── utils/            # Frontend utility functions
│   ├── .env.example          # Frontend environment configuration template
│   └── package.json          # Frontend dependencies and scripts
│
├── testing/                  # Additional testing resources
│   ├── bug-reports/
│   ├── integration/
│   ├── test-data/
│   └── unit/
│
├── .gitignore                # Git exclusion rules
├── LICENSE                   # MIT License
└── README.md                 # Project overview and setup documentation
```

Some directories are reserved for future development or documentation and may currently contain only placeholder files.

---

## Installation and Setup

Mosalinx is accessible through a web browser using the deployed application. No software installation or programming knowledge is required for general users.

Developers who want to run the application locally can follow the separate setup instructions below.

### Getting Started for Users

**Access the Application**

Visit the deployed Mosalinx application:

**https://mosalinx.onrender.com/**

Mosalinx is a web-based platform and does not require a desktop application or separate installation.

**1. Create an Account**

1. Open the Mosalinx website.
2. Select the registration option to create a new account.
3. Enter the requested account information.
4. Complete registration and sign in using your credentials.

Mosalinx uses Firebase Authentication to manage user registration and sign-in.

**2. Create Your First Project**

1. Sign in to access the Mosalinx dashboard.
2. Navigate to the project creation option.
3. Enter the requested project information.
4. Save the project to create its dedicated workspace.

Each project provides a centralized location for organizing creative work, resources, and collaboration.

**3. Invite Collaborators**

1. Open an existing project.
2. Navigate to the project's member or invitation management area.
3. Enter the information required to invite another registered Mosalinx user.
4. Submit the invitation.

Invited users can accept or decline invitations through the application. Project owners control invitations and membership management.

**4. Explore the Project Workspace**

Open a project to access its available workspace tools.

Depending on the selected feature, users can:

- View and manage project information.
- Access workspace files and folders.
- Organize creative resources.
- View project activity.
- Communicate through workspace posts.
- Access the project calendar.

**5. Manage Resources and Files**

Use the available resource and workspace file tools to organize project content.

- Upload supported resources to the project.
- Organize resources using categories.
- Search and browse uploaded resources.
- Create supported workspace file types.
- Open, edit, and manage workspace files.

Uploaded resources are stored using Cloud Storage for Firebase.

**6. Use the Calendar and Activity Feed**

The project calendar provides tools for organizing scheduled events and activities.

The activity feed displays supported actions and updates, helping team members follow changes within their projects.

**7. Manage Your Profile**

Use the available profile and account settings to review and update supported personal information and preferences.

### Feature Availability

Some interfaces demonstrate functionality intended for future development.

- **Team Messaging:** Prototype interface without persistent backend messaging.
- **Project Statistics:** Demonstration dashboard using sample data rather than live analytics.
- **Mosi AI Assistant:** Planned feature that was not implemented during the capstone.

These limitations do not prevent users from exploring the application's implemented project-management and collaboration features.

### Developer Setup

The following instructions are intended for developers who want to run Mosalinx locally, review its implementation, or contribute to continued development.

#### Prerequisites

Before beginning, ensure the following are available:

- Git
- Node.js and npm
- A MySQL database, either locally hosted or provided through a compatible cloud service
- A MySQL client, such as MySQL Workbench or the MySQL command-line client
- A Firebase project configured for Authentication and Cloud Storage
- Firebase configuration values and appropriate backend service credentials

The deployed application uses Aiven for MySQL hosting and Render for application deployment. Local development can use a separately configured MySQL database.

#### Clone the Repository

Clone the Mosalinx repository and navigate to its root directory:

```bash
git clone https://github.com/mr-wes7694/mosalinx.git
cd mosalinx
```

#### Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Install the required dependencies:

```bash
npm install
```

Create the backend environment configuration file:

```bash
cp .env.example .env
```

Update `.env` with the required database connection information, Firebase service credentials, and application settings.

For a complete explanation of the available configuration variables, see the [Environment Configuration](#environment-configuration) section.

Start the Express backend:

```bash
npm start
```

The backend uses the configured port and requires access to the appropriate MySQL database and Firebase services for supported functionality.

#### Frontend Setup

Open a separate terminal from the repository root and navigate to the frontend directory:

```bash
cd frontend
```

Install the required dependencies:

```bash
npm install
```

Create the frontend environment configuration file:

```bash
cp .env.example .env
```

Update `.env` with the backend API URL and Firebase client configuration.

For additional configuration details, see the [Environment Configuration](#environment-configuration) section.

Start the Vite development server:

```bash
npm run dev
```

Open the local development URL displayed in the terminal to access the frontend application.

The frontend and backend should run in separate terminal sessions during local development.

#### Development Verification

The repository includes scripts for testing and verifying application code.

**Frontend**

From the `frontend` directory:

```bash
npm run lint
npm run test
npm run build
```

**Backend**

From the `backend` directory:

```bash
npm test
```

These commands provide linting, automated testing, and build verification for the corresponding application components.

For additional information about the application's architecture, database configuration, and development practices, refer to the remaining technical sections of this README.

---

## Database Setup

Mosalinx uses MySQL to store relational application data, including user profiles, projects, memberships, invitations, resources, calendar events, and other workspace information.

The deployed application uses a cloud-hosted MySQL database provided by **Aiven**. Developers can configure a separate local or cloud-hosted MySQL database for development and testing.

Database configuration is only required when running the application locally. Users accessing the deployed Mosalinx website do not need to install or configure MySQL.

### Database Schema

The primary database schema is located at:

```text
database/schemas/schema.sql
```

This file defines the application's relational tables, primary and foreign keys, and relationships.

### Local Database Configuration

Developers using a local MySQL instance can create a development database named:

```text
mosalinx_dev
```

After creating the database, execute `database/schemas/schema.sql` against it to initialize the application tables.

Configure the backend `.env` file with the appropriate connection settings:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=mosalinx_dev
DB_USER=your_database_username
DB_PASSWORD=your_database_password
DB_SSL=false
```

The database user must have the permissions required for the application's database operations.

### Cloud Database Configuration

Developers using Aiven or another compatible cloud-hosted MySQL service should configure the backend environment variables with the connection information provided by their hosting service.

The backend supports SSL/TLS configuration through the following environment variables:

```env
DB_SSL=true
DB_SSL_CA=
DB_SSL_CA_PATH=
```

Certificate configuration depends on the database provider and deployment environment. Refer to `backend/.env.example` for the supported configuration fields.

### Database Migrations

Additional SQL migration files are maintained in:

```text
database/migrations/
```

These files document incremental database changes made during development, including updates to user profiles, application settings, comments, and calendar functionality.

The main schema already includes several changes represented by earlier migrations. Developers initializing a new database should begin with `schema.sql` and review the migrations before applying any additional changes to avoid duplicate tables or columns.

### Database Security

- Never commit database passwords, connection credentials, or private certificates to source control.
- Store sensitive configuration values in local `.env` files or secure deployment environment settings.
- Use separate database credentials and resources for development and production when possible.
- Avoid running schema initialization or migration scripts against an existing production database without reviewing their effects.

---

## Environment Configuration

Mosalinx uses environment variables to manage application settings, database connections, Firebase services, and communication between the frontend and backend.

Separate configuration templates are provided for each application:

```text
backend/.env.example
frontend/.env.example
```

During local development, these templates are copied into their respective `.env` files as described in the [Developer Setup](#developer-setup) instructions.

The following sections explain the configuration variables supported by each application, their purposes, and important security considerations.

Users accessing the deployed Mosalinx application do not need to configure environment variables.

### Backend Environment Configuration

The backend `.env` file contains settings for the Express server, MySQL database connectivity, and Firebase Admin SDK.

The backend configuration includes the following settings:

**Server Configuration**

```env
PORT=3000
```

**MySQL Database Configuration**

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=mosalinx_dev
DB_USER=your_database_username
DB_PASSWORD=your_database_password
DB_SSL=false
```

For cloud-hosted MySQL services such as Aiven, update the connection information and enable SSL/TLS as required.

The backend supports the following certificate configuration options:

```env
DB_SSL_CA=
DB_SSL_CA_PATH=./certs/ca.pem
```

`DB_SSL_CA` can provide certificate content through an environment variable, while `DB_SSL_CA_PATH` identifies a local certificate file.

**Firebase Backend Configuration**

```env
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY=your_firebase_private_key
```

These settings allow the backend to interact with Firebase services through the Firebase Admin SDK.

Firebase service account credentials must be obtained from an appropriately configured Firebase project and kept secure.

### Frontend Environment Configuration

The frontend `.env` file contains the backend API URL and Firebase client configuration required by the React application.

Configure the following values:

```env
VITE_API_BASE_URL=http://localhost:3000

VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

These variables configure communication with the backend API and initialize Firebase Authentication in the frontend application.

Vite exposes variables prefixed with `VITE_` to frontend code. These values are included in the client-side application bundle and must not contain private service account credentials, database passwords, or other server-side secrets.

### Production Configuration

The deployed Mosalinx application uses Render for hosting, Aiven for MySQL, and Firebase for authentication and file storage.

Production environment variables should be configured securely through the appropriate hosting platforms rather than committed to the repository.

Production settings may differ from local development settings, including database addresses, SSL/TLS requirements, Firebase project configuration, and backend API URLs.

### Security Guidelines

- Never commit `.env` files containing private credentials to source control.
- Keep database passwords, Firebase service account private keys, and other backend secrets confidential.
- Use the provided `.env.example` files as configuration templates without including real credentials.
- Do not place server-side secrets in frontend variables prefixed with `VITE_`.
- Store production credentials using secure environment configuration provided by the hosting platform.
- Review `.gitignore` rules to ensure sensitive configuration files are excluded from Git.

**Important:** The OpenAI API key remains commented out in the backend example configuration because the planned Mosi AI integration was not implemented during the capstone.

---

## Development Preparation

Mosalinx follows a structured development workflow using GitHub for version control and Jira for task management, sprint planning, and development tracking.

Before beginning development, contributors should ensure their local environment is configured and their repository is synchronized with the latest version of the project.

### Synchronize the Repository

Begin from the latest version of the `main` branch:

```bash
git checkout main
git pull origin main
```

Confirm that the working directory is clean before creating a new branch:

```bash
git status
```

### Create a Development Branch

Create a dedicated branch for the feature, fix, or task being developed:

```bash
git checkout -b feature/your-feature-name
```

Documentation-only changes may use a documentation branch:

```bash
git checkout -b docs/your-documentation-update
```

Branch names should clearly identify the purpose of the work. When applicable, include the associated Jira work item identifier to maintain traceability between development tasks and source code changes.

### Review Assigned Work

Before implementing changes, contributors should review the relevant Jira work item and confirm:

- The task description and expected functionality are understood.
- Entry criteria and prerequisites have been satisfied.
- Completion criteria and acceptance requirements are clearly defined.
- Dependencies and related work items have been reviewed.
- The assigned work is consistent with the current sprint objectives.

### Verify the Development Environment

After completing the local installation and environment configuration, verify that:

- The local repository is synchronized with the latest `main` branch.
- Required frontend and backend dependencies are installed.
- Frontend and backend `.env` files contain the necessary configuration values.
- A compatible MySQL database is available and accessible.
- The required database schema has been initialized.
- Firebase Authentication and Cloud Storage are configured for the development environment.
- Sensitive credentials and environment files are excluded from source control.
- The frontend and backend applications start successfully.

### Prepare for Implementation

Contributors should review the existing code and related components before making changes to maintain consistency with the application's architecture and established development patterns.

Changes should be developed and tested within their dedicated branches before being submitted for review.

For pull request requirements, code review procedures, and integration practices, refer to the Git Workflow section below.

---

## Git Workflow

Mosalinx uses a feature-branch development workflow supported by GitHub pull requests, peer code reviews, and Jira work item tracking. This process helps maintain code quality, coordinate team contributions, and ensure changes are reviewed and verified before being considered complete.

### Branch Management

Development begins from the latest version of the `main` branch.

```bash
git checkout main
git pull origin main
git checkout -b feature/MOS-123-example-feature
```

Contributors create dedicated branches for assigned features, bug fixes, or other development tasks. Branch names should identify the work being performed and, when applicable, reference the associated Jira work item.

Changes are committed with descriptive messages and pushed to GitHub for review.

### Pull Request Process

After completing implementation and local testing, the developer:

1. Pushes the development branch to GitHub.
2. Opens a pull request targeting `main`.
3. References the associated Jira work item.
4. Describes the implemented changes and relevant technical details.
5. Documents testing performed and the results.
6. Identifies any known limitations or follow-up work.

Pull requests provide a centralized record of implementation, testing, discussion, and approval.

### Peer Code Review

A team member reviews the pull request before it is merged.

The review process includes:

- Examining changed files for correctness, maintainability, and consistency with the existing architecture.
- Reviewing code comments and documentation where appropriate.
- Checking that the implementation satisfies the Jira work item's completion criteria.
- Evaluating error handling, authentication, authorization, and data integrity where applicable.
- Running relevant tests or manually verifying functionality.
- Leaving targeted inline comments when changes, clarification, or improvements are needed.
- Providing an overall review summary and approval when the implementation meets expectations.

When revisions are required, the developer addresses the feedback before the pull request is approved.

### Merge and Jira Review Status

After a pull request receives approval and its requirements have been satisfied, the reviewer merges the changes into `main`.

The reviewer then updates the associated Jira work item to **Review Complete**.

This status indicates that the implementation has passed peer review and has been integrated into the main codebase.

### Final Developer Verification

After the pull request has been merged, the original developer performs the final verification of their completed work.

This includes confirming that:

- The approved changes are present in `main`.
- The implementation remains functional after integration.
- The work item's completion criteria have been satisfied.
- Any required documentation or follow-up information has been recorded.

Once verification is complete, the developer moves the Jira work item to **Verified Complete**.

This final status confirms that the work has completed both peer review and post-merge verification.

### Development Integration and Testing Practices

Throughout development, team members regularly synchronized their branches with `main`, resolved merge conflicts, and performed local verification before submitting or approving changes.

Frontend linting, application builds, automated backend tests, and manual feature testing were used where applicable to support code quality and integration stability.

The team also conducted structured usability testing to evaluate the application from an end-user perspective.

### Workflow Summary

```text
Jira Work Item
      |
      v
Development Branch
      |
      v
Implementation and Local Testing
      |
      v
GitHub Pull Request
      |
      v
Peer Review and Approval
      |
      v
Merge into Main
      |
      v
Jira: Review Complete
      |
      v
Developer Final Verification
      |
      v
Jira: Verified Complete
```

This workflow provides traceability between project requirements, implementation, peer review, and final verification while supporting coordinated development across the Mosalinx team.

---

## Contributors

Mosalinx was designed and developed by a three-member team as part of the **Bachelor of Science in Computer Science Capstone Project at Full Sail University**.

Each contributor participated in planning, implementation, integration, testing, and refinement throughout the development lifecycle, with primary responsibilities spanning project coordination, frontend development, backend development, and interface design.

### Veronica Johnson
**Project Planning, Database Development, Integration, and Documentation**

- Led project planning, sprint organization, Jira administration, and development task coordination.
- Developed and maintained the Software Design Document (SDD), including system architecture documentation, use cases, database design, and technical specifications.
- Designed the relational MySQL database schema and supported database configuration and connectivity.
- Configured development environment files, repository documentation, and application integration requirements.
- Implemented and tested backend functionality, including project invitation and membership-related APIs.
- Contributed to frontend functionality, resource management, workspace file integration, and application refinements.
- Coordinated pull request reviews, integration testing, and Jira verification workflows.
- Participated in usability testing, documented findings, and supported final application validation.
- Established the original Mosalinx branding direction and logo concept.

### Wesley Filion
**Frontend Development, User Interface Design, and Application Integration**

- Developed core frontend functionality using React, Vite, and JavaScript.
- Implemented application navigation, authentication interfaces, and dashboard components.
- Contributed to project workspace interfaces and collaboration features.
- Developed and refined frontend layouts, interactive components, and application styling.
- Created and maintained Figma interface prototypes and design references.
- Integrated frontend functionality with authentication services and backend APIs.
- Contributed to workspace communication, application settings, and project statistics interfaces.
- Participated in pull request reviews, integration testing, and usability testing.
- Refined the Mosalinx logo and implemented the application's visual branding.

### Lesly Martinez
**Backend Development, Application Integration, and Mascot Design**

- Developed backend functionality using Node.js, Express, and MySQL.
- Implemented API routes, controllers, and application logic supporting core platform features.
- Contributed to database integration, user management, and authentication-related functionality.
- Developed project collaboration features, including invitation and membership functionality.
- Contributed to profile management, calendar integration, and application data operations.
- Supported frontend/backend integration and feature testing.
- Participated in pull request reviews, usability testing, and application refinement.
- Contributed to project statistics concepts and interface design.
- Designed Mosi, the Mosalinx mascot and proposed AI assistant character.

### Academic Project

Mosalinx was developed as a collaborative capstone project at **Full Sail University**, demonstrating the team's application of software engineering principles, full-stack development, database design, Agile project management, version control, peer review, and usability testing.

The project reflects the combined contributions of all three team members throughout its planning, development, integration, and evaluation phases.

---

## Project Status

**Status: Capstone Implementation Complete | Deployed Prototype**

Mosalinx has reached the final stage of its development as a Full Sail University Computer Science Capstone Project. The application has progressed through planning, system design, implementation, integration, and usability testing, resulting in a deployed collaborative workspace with functional core features.

The capstone implementation demonstrates a full-stack web application integrating project management, creative resource organization, user authentication, and team collaboration.

### Completed Development

The capstone implementation includes:

- React and Vite frontend with application routing and reusable interface components.
- Node.js and Express backend with REST API endpoints.
- MySQL relational database hosted through Aiven.
- Firebase Authentication with protected application routes.
- Cloud Storage for Firebase integration for project resources.
- Project creation, management, and collaborator invitations.
- Project workspaces with file organization and editing tools.
- Resource uploads, categorization, and search functionality.
- Dashboard navigation, workspace posts, and activity tracking.
- Calendar and event management functionality.
- User profile management and account settings.
- Deployment through Render.

### Testing and Evaluation

The Mosalinx team conducted development testing, integration verification, peer code reviews, and structured usability testing throughout the capstone.

The final usability evaluation included **five completed testing sessions out of six originally planned**, using standardized scenarios and dedicated test accounts.

Testing focused on the application's usability, navigation, project management, collaboration tools, and overall user experience.

Findings were documented to identify functional issues, usability concerns, and opportunities for future refinement.

### Prototype and Planned Functionality

Some features were developed as interface prototypes or reserved for future implementation.

- **Team Messaging:** Frontend demonstration interface without persistent backend messaging.
- **Project Statistics:** Prototype dashboard using sample data rather than live project information.
- **Mosi AI Assistant:** Proposed AI-assisted brainstorming feature that was not implemented during the capstone.
- **Real-Time Collaboration:** Simultaneous multi-user file editing remains a potential future enhancement.

These features represent opportunities for further development beyond the initial capstone scope.

### Deployment and Availability

Mosalinx is available as a deployed web application:

**https://mosalinx.onrender.com/**

Users can register, sign in, and explore the implemented functionality through their web browsers.

The application is provided as an academic capstone prototype rather than a production-ready commercial service. Continued development, security review, performance testing, and operational improvements would be necessary before a broader production release.

### Future Development

Potential future work includes expanding communication functionality, connecting statistics to live application data, implementing the Mosi AI assistant, improving collaborative editing capabilities, and refining the platform based on usability testing feedback.

The Mosalinx repository documents the team's completed capstone implementation and provides a foundation for continued development.

---

## License

Mosalinx is licensed under the **MIT License**. See the repository's [LICENSE](LICENSE) file for the full license terms.

---

## About the Project

Mosalinx was developed as a collaborative capstone project for the **Bachelor of Science in Computer Science program at Full Sail University**.

The project was created to address a common challenge faced by independent creators and small creative teams: managing projects, communication, resources, and creative ideas across multiple disconnected applications.

By bringing these tools together within a centralized workspace, Mosalinx aims to make creative collaboration more organized, accessible, and efficient.

Throughout development, the team applied software engineering principles and practical experience in full-stack development, relational database design, cloud service integration, Agile project management, version control, peer code review, and usability testing.

The completed capstone implementation demonstrates the foundation of this vision through functional project workspaces, resource management, collaboration tools, and integrated cloud services.

### Long-Term Vision

The long-term goal of Mosalinx is to provide a connected creative environment where individuals and teams can manage projects, organize resources, communicate, track progress, and develop ideas without relying on numerous separate applications.

Future enhancements may expand the platform's communication, analytics, AI-assisted brainstorming, and real-time collaboration capabilities.

Mosalinx represents both the team's academic accomplishments and a foundation for potential continued development beyond the capstone project.
