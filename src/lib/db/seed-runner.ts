import { seedTursoDatabase } from './turso-seed';

// Run the seed function
seedTursoDatabase()
  .then(() => {
    console.log('✅ Seed completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  });
