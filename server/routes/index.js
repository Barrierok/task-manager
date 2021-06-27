import welcome from './welcome';
import users from './users';
import session from './session';
import statuses from './statuses';
import tasks from './tasks';
import labels from './labels';

const controllers = [welcome, users, session, statuses, tasks, labels];

export default (app) => controllers.forEach((f) => f(app));
