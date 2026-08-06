# Mosalinx Database Schema Plan

## Purpose

This document outlines the planned expansion and refinement of the Mosalinx MySQL database schema.

The current implementation contains initial `users` and `projects` tables. This plan compares that implementation against the approved Software Design Document and Entity Relationship Diagram to identify required tables, relationships, constraints, and architectural decisions.

## Source of Truth

Database planning is based on the final Mosalinx Software Design Document, including:

- Database requirements
- MVP and future feature requirements
- Use cases
- Workspace roles and permissions
- Entity Relationship Diagram
- Firebase Authentication and Cloud Storage architecture

## Current Implemented Schema

### `users`

Current fields:

- `user_id`
- `name`
- `email`
- `password_hash`
- `created_at`

### `projects`

Current fields:

- `project_id`
- `project_name`
- `description`
- `owner_id`
- `created_at`

### Current Relationship

- `projects.owner_id` references `users.user_id`

## Design Document ERD Entities

The approved ERD includes:

- `USER`
- `WORKSPACE`
- `WORKSPACE_MEMBERSHIP`
- `PROJECT`
- `TASK`
- `COMMENT`
- `CALENDAR_EVENT`
- `AI_INTERACTION`
- `RESOURCE`
- `CONTACT`

## Initial Schema Gaps

Compared with the original Design Document ERD, the current schema does not yet include:

- `workspaces`
- `workspace_memberships`
- `tasks`
- `comments`
- `calendar_events`
- `ai_interactions`
- `resources`
- `contacts`

The MVP architecture described later in this document replaces the separate
`workspaces` and `workspace_memberships` entities with the Project Workspace
model and `project_members` relationship.

## Authentication Review

The current `users` table includes `password_hash`.

The Design Document specifies Firebase Authentication for user registration and login. Because Firebase manages passwords and credentials, the MySQL schema should likely store a Firebase user identifier rather than a local password hash.

Proposed review:

- Remove or replace `password_hash`
- Add `firebase_uid`
- Keep `email`
- Confirm whether `firebase_uid` or `user_id` should be the primary application identifier
- Add `updated_at`
- Review profile fields against the ERD

## Proposed Foundation Tables

### `users`

#### Purpose

Stores Mosalinx application profile data for users authenticated through Firebase Authentication.

Firebase will manage passwords and login credentials. The MySQL `users` table will store the Firebase user identifier and the profile information required by Mosalinx.

#### Proposed Columns

| Column | Data Type | Constraints | Purpose |
|---|---|---|---|
| `user_id` | `BIGINT UNSIGNED` | Primary Key, Auto Increment | Internal Mosalinx user identifier |
| `firebase_uid` | `VARCHAR(128)` | Unique, Not Null | Firebase Authentication user identifier |
| `display_name` | `VARCHAR(100)` | Not Null | User-facing display name |
| `email` | `VARCHAR(255)` | Unique, Not Null | User account email |
| `profile_image_url` | `VARCHAR(500)` | Nullable | Optional user profile image |
| `created_at` | `TIMESTAMP` | Default Current Timestamp | Date and time the user record was created |
| `updated_at` | `TIMESTAMP` | Auto-updated | Date and time the user record was last updated |

#### Planned Changes From Current Schema

- Retain an internal numeric `user_id`.
- Add `firebase_uid`.
- Rename `name` to `display_name`.
- Remove `password_hash`.
- Retain unique `email`.
- Add optional `profile_image_url`.
- Add `updated_at`.

#### Identity Strategy

Mosalinx will use:

- `firebase_uid` to connect the MySQL user record to Firebase Authentication.
- `user_id` as the primary relational identifier referenced by other MySQL tables.

### `projects`

#### Purpose

Stores the primary information for each Mosalinx Project Workspace.

The project itself will not store a separate `owner_id`. Ownership and all other
project roles will be represented through the `project_members` table.

#### Proposed Columns

| Column | Data Type | Constraints | Purpose |
|---|---|---|---|
| `project_id` | `BIGINT UNSIGNED` | Primary Key, Auto Increment | Internal project identifier |
| `project_name` | `VARCHAR(150)` | Not Null | User-facing project name |
| `description` | `TEXT` | Nullable | Optional project description |
| `created_at` | `TIMESTAMP` | Default Current Timestamp | Date and time the project was created |
| `updated_at` | `TIMESTAMP` | Auto-updated | Date and time the project was last updated |

#### Ownership Strategy

Project ownership will be represented through the `project_members` table rather than
through a separate `projects.owner_id` column.

When a project is created:

1. The project record is created.
2. The creator is added to `project_members`.
3. The creator receives the `owner` role.

This provides one consistent source for project membership, roles, and permissions.

#### Planned Changes From Current Schema

- Retain `project_id`.
- Retain `project_name`.
- Retain nullable `description`.
- Remove `owner_id`.
- Retain `created_at`.
- Add `updated_at`.
- Move ownership into `project_members`.

### `project_members`

#### Purpose

Connects users to projects and stores each member's role within a Mosalinx Project Workspace.

This table will include every project member, including the project creator. The creator will automatically receive the `owner` role when the project is created.

#### Proposed Columns

| Column | Data Type | Constraints | Purpose |
|---|---|---|---|
| `project_member_id` | `BIGINT UNSIGNED` | Primary Key, Auto Increment | Internal membership identifier |
| `project_id` | `BIGINT UNSIGNED` | Foreign Key, Not Null | Project the user belongs to |
| `user_id` | `BIGINT UNSIGNED` | Foreign Key, Not Null | User associated with the membership |
| `role` | `VARCHAR(30)` | Not Null | Member role within the project |
| `joined_at` | `TIMESTAMP` | Default Current Timestamp | Date and time the user joined the project |
| `updated_at` | `TIMESTAMP` | Auto-updated | Date and time the membership was last updated |

#### Supported MVP Roles

The initial MVP will support:

- `owner`
- `admin`
- `collaborator`

Additional roles or custom permission levels may be added in future versions.

#### Relationships

- `project_members.project_id` references `projects.project_id`.
- `project_members.user_id` references `users.user_id`.
- One user may belong to multiple projects.
- One project may contain multiple users.

#### Constraints

- A user may only have one membership record per project.
- The combination of `project_id` and `user_id` must be unique.
- Every project must have one owner for the MVP.
- The project creator is automatically inserted into this table with the `owner` role.
- Deleting a project should remove its related membership records.
- Deleting a user should not silently leave invalid membership records.

#### Permission Strategy

Application permissions will be determined using the member's `role`.

Initial expectations:

- `owner` can manage the project, members, roles, settings, and shared resources.
- `admin` can manage project content and members based on granted permissions.
- `collaborator` can contribute content and use project features available to members.

Detailed permissions will be enforced by the Express backend rather than relying only on the database role value.

#### Required Database Rules

The implemented table should include:

- A unique constraint on `project_id` and `user_id`.
- An index on `project_id`.
- An index on `user_id`.
- Foreign-key relationships to `projects` and `users`.

## Workspace and Project Architecture Decision

### Recommended MVP Approach

For the initial Mosalinx MVP, each project will function as its own collaborative
Project Workspace.

The term "Project Workspace" describes the user-facing environment containing
the project's resources, posts, communication, calendar information, team members,
activity, and future AI interactions. It will not initially require a separate
`workspaces` database table.

The initial membership relationship will therefore use:

`users → project_members → projects`

rather than:

`users → workspace_memberships → workspaces → projects`

This approach better matches the current MVP use cases, which focus on creating
projects, inviting members to projects, uploading project resources, posting within
project workspaces, and viewing project activity.

A separate organization-level `workspaces` entity may be introduced in a future
version if Mosalinx needs to support multiple projects under one shared organization
or team account.

### Resulting Core Structure

- `users`
- `projects`
- `project_members`

Project-specific feature tables will reference `project_id`, including:

- `resources`
- `workspace_posts`
- `messages`
- `calendar_events`
- `tasks`
- `activity_logs`
- `ai_interactions`

## Immediate Priorities

The initial database foundation has been defined as:

1. Update the `users` table for Firebase Authentication integration.
2. Update the `projects` table to use the Project Workspace architecture.
3. Implement the `project_members` junction table for membership, ownership, and roles.
4. Add required foreign keys, indexes, and uniqueness constraints.
5. Validate the foundation schema before integrating it with the Express backend.
6. Defer feature-specific tables until their implementation sprint where appropriate.