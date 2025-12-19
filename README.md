# ISE Alumni Portal

[![CD](https://github.com/ise-alumni/portal/actions/workflows/cd.yml/badge.svg)](https://github.com/ise-alumni/portal/actions/workflows/cd.yml)[![CI](https://github.com/ise-alumni/portal/actions/workflows/ci.yml/badge.svg)](https://github.com/ise-alumni/portal/actions/workflows/ci.yml)[![CodeQL](https://github.com/ise-alumni/portal/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/ise-alumni/portal/actions/workflows/github-code-scanning/codeql)[![Dependabot Updates](https://github.com/ise-alumni/portal/actions/workflows/dependabot/dependabot-updates/badge.svg)](https://github.com/ise-alumni/portal/actions/workflows/dependabot/dependabot-updates)[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=ise-alumni_portal&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=ise-alumni_portal)

A portal for managing the alumni for ISE - facilitating events, announcements and the alumni's connection to the ISE programme.

## Overview

The ISE Alumni Portal is a comprehensive platform designed to help Immersive Software Engineering (ISE) alumni stay connected with the program, manage events, share announcements, and maintain their professional network.

## Features

- **Alumni Directory**: Searchable directory of ISE alumni with profile information
- **Events Management**: Create, manage, and RSVP to alumni events
- **Announcements**: Share and view important announcements
- **Interactive Map**: Visualize alumni locations and movement paths
- **Profile Management**: Update and maintain your alumni profile
- **Dashboard**: Admin dashboard for managing users and content

## Tech Stack

- **Frontend**: Vite + React + TypeScript
- **UI Components**: ShadCN UI + Radix UI
- **Backend/Database**: Supabase (PostgreSQL)
- **State Management**: TanStack Query (React Query)
- **Styling**: Tailwind CSS
- **Testing**: Vitest + Testing Library
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Supabase CLI (for database migrations)
- A Supabase project (for local development)

### Installation

```bash
# Clone the repository
git clone https://github.com/bxrne/ise-alumni.git 
cd ise-alumni 

# Copy environment variables
cp .env.example .env 
# Edit .env with your Supabase credentials

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The development server will start on `http://localhost:8080` (or the next available port).

### Running Tests

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:ui
```

### Building for Production

```bash
pnpm build
```

## Database Migrations

To change the database schema, run the following workflow:

```bash
# Connect project to Supabase instance (if not already linked)
supabase link

# Pull remote migration table
supabase db pull

# Push local migrations to the database
supabase db push
```

## Feature Flags

Some features may not be released to users but pushed regardless (they may be toggled over time). Feature flags are configured in [features.ts](./src/config/features.ts).

## Support

- **Issues**: [GitHub Issues](https://github.com/bxrne/ise-alumni/issues)

