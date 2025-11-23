# ISE Alumni Portal

A portal for managing the alumni for ISE - facilitating events, announcements and the alumni's connection to the ISE programme.

## Infrastructure

- BaaS (Database + Backend) -> Supabase
- Portal -> Vite + React + ShadCN
- Build System -> pnpm

## Development

```bash
git clone https://github.com/bxrne/ise-alumni.git 
cd ise-alumni 

cp .env.example .env 

pnpm i # install deps 
pnpm dev # run dev server

pnpm test # run tests
pnpm test:coverage # run tests with coverage report
```

### Migrations

To change DB schmema run the following workflow:

```bash
supabase link # connect project to instance if not already 

supabase db pull # pull remote migration table 
supabase db push # push local migrations to the db
```

## Feature flags 

Some features may not be released to users but pushed regardless (they may be toggled over time) to facilitate this we can use the values in [features.ts](./src/config/features.ts)

