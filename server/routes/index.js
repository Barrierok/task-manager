import welcome from './welcome.js';
import users from './users.js';
import session from './session.js';
import statuses from './statuses';
import tasks from './tasks';

const controllers = [welcome, users, session, statuses, tasks];

export default (app) => controllers.forEach((f) => f(app));
