# ISE Alumni Portal

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
- **Package Manager**: Bun
- **Task Runner**: Just

## Quick Start

### Prerequisites

- **Docker Desktop** ([macOS](https://docs.docker.com/desktop/install/mac-install/) | [Windows](https://docs.docker.com/desktop/install/windows-install/) | [Linux](https://docs.docker.com/desktop/install/linux-install/))
- **Just** command runner ([Installation Guide](https://github.com/casey/just#installation))
- **Access to the ISE Alumni Supabase project** (request from maintainers)

### Setup

```bash
# Clone the repository
git clone https://github.com/bxrne/ise-alumni.git
cd ise-alumni

# Run the automated setup (one-time only)
just setup
# This will install Bun, Supabase CLI, and configure your environment

# Start development (Supabase + Frontend)
just start
```

The development server will be available at `http://localhost:5173` and Supabase Studio at `http://127.0.0.1:54323`.

## Development

For detailed information about development workflows, database migrations, testing, and contributing guidelines, see **[CONTRIBUTING.md](./CONTRIBUTING.md)**.

### Common Commands

| Command | Description |
|---------|-------------|
| `just start` | Start Supabase + frontend dev server |
| `just stop` | Stop all services |
| `just seed` | Add sample data for testing |
| `just test` | Run tests in watch mode |
| `just build` | Build for production |

Run `just` to see all available commands.

## Support

- **Issues**: [GitHub Issues](https://github.com/bxrne/ise-alumni/issues)
- **Contributing**: See [CONTRIBUTING.md](./CONTRIBUTING.md)
