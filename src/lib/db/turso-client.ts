// Database access is now handled server-side via server/db.ts.
// Frontend communicates through the API layer (src/lib/api.ts).
export const now = () => new Date().toISOString();
