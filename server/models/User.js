import { Model } from 'objection';
import objectionUnique from 'objection-unique';
import path from 'path';

import encrypt from '../lib/secure.js';

const unique = objectionUnique({ fields: ['email'] });

export default class User extends unique(Model) {
  static get tableName() {
    return 'users';
  }

  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['email', 'password', 'firstName', 'lastName'],
      properties: {
        id: { type: 'integer' },
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 3 },
        firstName: { type: 'string', minLength: 1 },
        lastName: { type: 'string', minLength: 1 },
      },
    };
  }

  static relationMappings = {
    executedTasks: {
      relation: Model.HasManyRelation,
      modelClass: path.join(__dirname, 'Task'),
      join: {
        from: 'user.id',
        to: 'tasks.executorId',
      },
    },
    createdTasks: {
      relation: Model.HasManyRelation,
      modelClass: path.join(__dirname, 'Task'),
      join: {
        from: 'user.id',
        to: 'tasks.creatorId',
      },
    },
  };

  set password(value) {
    this.passwordDigest = encrypt(value);
  }

  verifyPassword(password) {
    return encrypt(password) === this.passwordDigest;
  }
}
