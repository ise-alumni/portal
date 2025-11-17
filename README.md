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

## Logging Configuration

The application uses Pino for structured logging with environment-based configuration:

### Log Levels
- **Development**: `debug` (verbose logging for development)
- **Production**: `info` (standard logging)
- **Test**: `silent` (no logging output)

### Environment Variables
Add to your `.env` file to configure logging:

```bash
# Set log level (optional, defaults based on environment)
VITE_LOG_LEVEL=info  # Available: trace, debug, info, warn, error, silent
```

### Usage in Code
```typescript
import { log } from '@/lib/utils/logger';

log.debug('Debug information:', data);
log.info('General information:', data);
log.warn('Warning message:', data);
log.error('Error occurred:', error, data);
```

