require('dotenv').config();
const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.MONGODB_URL);

async function updateRole() {
  await client.connect();
  const result = await client.db('fable').collection('user').updateOne(
    { email: 'hridi@gmail.com' },
    { $set: { role: 'writer' } }
  );
  console.log('Updated:', result.modifiedCount);
  client.close();
}

updateRole();