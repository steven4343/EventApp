import { database } from './database';

database.initialize()
  .then(() => {
    console.log('Migration complete');
    process.exit(0);
  })
  .catch((e: Error) => {
    console.error(e);
    process.exit(1);
  });
