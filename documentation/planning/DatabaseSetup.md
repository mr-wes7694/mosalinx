# Mosalinx Local Database Setup

## Purpose

This document describes the local MySQL development environment used by Mosalinx.

The local database environment allows developers to run and test the Mosalinx backend without requiring a shared production database.

## Requirements

- MySQL Server 8.0 or compatible version
- MySQL Workbench or another MySQL client
- Node.js and npm for backend development

## Local Development Database

Mosalinx uses the following database for local development:

- Database name: `mosalinx_dev`
- Host: `localhost`
- Port: `3306`
- Character set: `utf8mb4`
- Collation: `utf8mb4_0900_ai_ci`

The database can be created with:

```sql
CREATE DATABASE IF NOT EXISTS mosalinx_dev
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_0900_ai_ci;
```

## Database Credentials

Database credentials must not be committed to version control.

Each developer will configure their own local MySQL credentials through environment variables used by the Mosalinx backend.

Planned environment variables include:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

A safe `.env.example` file may be included in the repository to document required variables without containing passwords or other secrets.

## Schema Management

The canonical Mosalinx database schema will be maintained in the repository under:

`database/schema.sql`

Database migrations will be stored under:

`database/migrations/`

Schema changes should be committed through the project's feature-branch workflow and reviewed before integration.

## Current Status

The local MySQL development environment has been configured and verified.

The `mosalinx_dev` database has been created successfully.

Implementation of the Mosalinx application tables will follow the approved database architecture and schema plan.