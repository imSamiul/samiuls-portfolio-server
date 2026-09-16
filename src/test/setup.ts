import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll } from 'vitest';

import { connectDatabase, disconnectDatabase } from '../config/db.js';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await connectDatabase(mongoServer.getUri('portfolio-test'));

  // The unique index on users is asserted by the very first auth test, so it is
  // built up front instead of racing the background build autoIndex starts.
  await Promise.all(
    Object.values(mongoose.models).map((model) => model.syncIndexes()),
  );
});

afterEach(async () => {
  await Promise.all(
    Object.values(mongoose.connection.collections).map((collection) =>
      collection.deleteMany({}),
    ),
  );
});

afterAll(async () => {
  await disconnectDatabase();
  await mongoServer.stop();
});
