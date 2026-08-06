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

The current schema does not yet include:

- `workspaces`
- `workspace_memberships`
- `tasks`
- `comments`
- `calendar_events`
- `ai_interactions`
- `resources`
- `contacts`

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

## Workspace and Project Architecture Decision

### Recommended MVP Approach

For the initial Mosalinx MVP, each project will function as its own collaborative
Project Workspace.

The term "Project Workspace" describes the user-facing environment containing
the project's resources, posts, communication, calendar information, team members,
activity, and future AI interactions. It will not initially require a separate
`workspaces` database table.

The initial membership relationship will therefore use:

`USER → PROJECT_MEMBER → PROJECT`

rather than:

`USER → WORKSPACE_MEMBERSHIP → WORKSPACE → PROJECT`

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

1. Confirm workspace versus project architecture.
2. Update the user model for Firebase Authentication.
3. Compare current project fields against the ERD.
4. Design membership and role relationships.
5. Identify the minimum tables needed for the Sprint 3 foundation.
6. Defer feature-specific tables until their implementation sprint where appropriate.