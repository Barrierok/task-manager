import dotenv from 'dotenv';
import path from 'path';
import fastify from 'fastify';
import fastifyStatic from 'fastify-static';
import fastifyErrorPage from 'fastify-error-page';
import pointOfView from 'point-of-view';
import fastifyFormbody from 'fastify-formbody';
import fastifySecureSession from 'fastify-secure-session';
import fastifyPassport from 'fastify-passport';
import fastifySensible from 'fastify-sensible';
import fastifyReverseRoutes from 'fastify-reverse-routes';
import fastifyMethodOverride from 'fastify-method-override';
import fastifyObjectionjs from 'fastify-objectionjs';
import Rollbar from 'rollbar';
import qs from 'qs';
import Pug from 'pug';
import i18next from 'i18next';
import ru from './locales/ru.js';
import webpackConfig from '../webpack.config.babel.js';

import addRoutes from './routes/index.js';
import getHelpers from './helpers/index.js';
import knexConfig from '../knexfile.js';
import models from './models';
import FormStrategy from './lib/passportStrategies/FormStrategy.js';

dotenv.config();
const mode = process.env.NODE_ENV || 'development';
const isProduction = mode === 'production';
const isDevelopment = mode === 'development';

const setUpViews = (app) => {
  const { devServer } = webpackConfig;
  const devHost = `http://${devServer.host}:${devServer.port}`;
  const domain = isDevelopment ? devHost : '';
  const helpers = getHelpers(app);
  app.register(pointOfView, {
    engine: {
      pug: Pug,
    },
    includeViewExtension: true,
    defaultContext: {
      ...helpers,
      assetPath: (filename) => `${domain}/assets/${filename}`,
    },
    templates: path.join(__dirname, '..', 'server', 'views'),
  });

  app.decorateReply('render', function render(viewPath, locals) {
    return this.view(viewPath, { ...locals, reply: this });
  });
};

const setUpStaticAssets = (app) => {
  const pathPublic = isProduction
    ? path.join(__dirname, '..', 'public')
    : path.join(__dirname, '..', 'dist', 'public');
  app.register(fastifyStatic, {
    root: pathPublic,
    prefix: '/assets/',
  });
};

const setupLocalization = () => {
  i18next.init({
    lng: 'ru',
    fallbackLng: 'en',
    debug: isDevelopment,
    resources: {
      ru,
    },
  });
};

const addHooks = (app) => {
  app.addHook('preHandler', async (req, reply) => {
    reply.locals = {
      isAuthenticated: () => req.isAuthenticated(),
    };
  });
};

const initRollbar = (app) => {
  if (!isProduction) {
    return;
  }

  const rollbar = new Rollbar({
    accessToken: process.env.ROLLBAR_TOKEN,
    captureUncaught: true,
    captureUnhandledRejections: true,
  });

  rollbar.log('Rollbar initialized');

  app.setErrorHandler((error, request, reply) => {
    rollbar.error(`Error: ${error}`, request, reply);
  });
};

const registerPlugins = (app) => {
  app.register(fastifySensible);
  app.register(fastifyErrorPage);
  app.register(fastifyReverseRoutes.plugin);
  app.register(fastifyFormbody, { parser: qs.parse });
  app.register(fastifySecureSession, {
    secret: process.env.SESSION_KEY,
    cookie: {
      path: '/',
    },
  });
  app.register(fastifyPassport.initialize());
  app.register(fastifyPassport.secureSession());

  fastifyPassport.use(new FormStrategy('form', app));

  fastifyPassport.registerUserSerializer((user) => user.id);
  fastifyPassport.registerUserDeserializer((id) => app.objection.models.user.query().findById(id));

  app.decorate('fp', fastifyPassport);
  app.decorate('authenticate', (...args) => fastifyPassport.authenticate('form', {
    failureRedirect: app.reverse('root'),
    failureFlash: i18next.t('flash.authError'),
  })(...args));

  app.register(fastifyMethodOverride);
  app.register(fastifyObjectionjs, {
    knexConfig: knexConfig[mode],
    models,
  });
};

export default () => {
  const app = fastify({
    logger: {
      ...(isDevelopment && {
        prettyPrint: {
          colorize: true,
        },
      }),
    },
  });

  registerPlugins(app);

  setupLocalization();
  setUpViews(app);
  setUpStaticAssets(app);
  addHooks(app);
  initRollbar(app);

  app.after(() => addRoutes(app));

  return app;
};
