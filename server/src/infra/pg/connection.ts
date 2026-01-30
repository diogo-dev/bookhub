import 'dotenv/config';
import { Client } from 'pg';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

client.connect()
  .then(() => console.log('Connected to database.\n'))
  .catch(error => console.error('Connection failed.\n', error));

export { client };
