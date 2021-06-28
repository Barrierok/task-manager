// @ts-check
require('dotenv').config();
const path = require('path');
const { knexSnakeCaseMappers } = require('objection');

const connection = {
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
};

const common = {
  useNullAsDefault: true,
  migrations: {
    directory: path.resolve('migrations'),
  },
  ...knexSnakeCaseMappers(),
};

module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './database.sqlite',
    },
    ...common,
  },
  test: {
    client: 'sqlite3',
    connection: ':memory:',
    ...common,
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL || connection,
    ...common,
  },
};
