import _ from 'lodash';
import { Strategy } from 'fastify-passport';
import UserRepository from '../../repositories/UserRepository';

export default class FormStrategy extends Strategy {
  constructor(name, app) {
    super(name);
    this.userRepository = new UserRepository(app);
  }

  async authenticate(request) {
    if (request.isAuthenticated()) {
      return this.pass();
    }

    const email = _.get(request, 'body.data.email', null);
    const password = _.get(request, 'body.data.password', null);
    const user = await this.userRepository.getByParams({ email });
    if (user && user.verifyPassword(password)) {
      return this.success(user);
    }

    return this.fail();
  }
}
