const Hapi = require('hapi');
const Joi = require('joi');
const server = module.exports = new Hapi.Server();

/***************************Server Config******************************/

server.connection({
  port: 8000,
});

//server.auth.scheme('token', require('./app/plugins/auth/auth'));
//server.auth.strategy('default', 'token');

const goodConfig = {
  reporters: [{
    reporter: require('good-console'),
    events: {
      log: '*',
      request: '*',
      error: '*',
    },
  }, {
    config: 'error.log',
    reporter: require('good-file'),
    events: {
      request: 'ERROR',
      error: '*',
    },
  }, {
    config: 'debug.log',
    reporter: require('good-file'),
    events: {
      log: '*',
      request: ['INFO'],
      reponse: '*',
    },
  }, {
    config: 'auth.log',
    reporter: require('good-file'),
    events: {
      request: 'AUTH',
      reponse: 'AUTH',
    },
  },
  ],
};

const mongoConfig = (process.env.NODE_ENV === 'test') ?
  require('./app/plugins/mongodb/config.js').test :
  require('./app/plugins/mongodb/config').postman;

/*********************************Plugins**********************************/

//MongoDB
const MongoPlugin = server.register({
  register: require('hapi-mongodb'),
  options: mongoConfig,
});

//Good
const GoodPlugin = server.register({
  register: require('good'),
  options: goodConfig,
});

//Blipp
const BlippPlugin = server.register({
  register: require('blipp'),
  options: {
    showStart: true,
    showAuth: true,
  },
});

//Lout
const LoutPlugin = server.register([require('vision'), require('inert'), require('lout')]);

//TV
//FIXME Only in DEVELOPMENT!!!
const TVPlugin = server.register([require('vision'), require('inert'), require('tv')]);

/**************************Routing************************************/

const routeStart = () => server.route([{
  method: 'GET',
  path: '/projects',
  config: {
    //auth: 'default',
    description: 'Retrieve the patchworks projects',
    tags: ['projects', 'patchwork'],
    validate: {
      params: {
        index: Joi.string().required(),
      },
    },
    cors: {
      origin: ['http://localhost:8080'], //FIXME Remove in production
    },
  },
  handler: require('./app/handlers/GET/projects/'),
},
]);

/**********************************Start***********************************/
const start = () => {
  routeStart();

  server.log('INFO', 'Routing Configured');
  return LoutPlugin;
};

const loutStart = (err) => {
  if (err) {
    server.log('ERROR', 'Lout Error');
    return Promise.reject(err);
  }

  server.log('INFO', 'Lout Configured');
  return TVPlugin;
};

const tvStart = (err) => {
  if (err) {
    server.log('ERROR', 'Tv Error');
    return Promise.reject(err);
  }

  server.log('INFO', 'Tv Configured');
  return MongoPlugin;
};

const mongoStart = (err) => {
  if (err) {
    server.log('ERROR', 'MongoDB Error');
    return Promise.reject(err);
  }

  server.log('INFO', 'MongoDB running on ' + mongoConfig.url);
  return BlippPlugin;
};

const blippStart = (err) => {
  if (err) {
    server.log('ERROR', 'Blipp Error');
    return Promise.reject(err);
  }

  server.log('INFO', 'Blipp Configured');
  return GoodPlugin;
};

/*eslint consistent-return:1*/
const serverStart = (err) => {
  if (err) {
    server.log('ERROR', 'Good Error');
    return Promise.reject(err);
  }

  server.log('INFO', 'Good Configured');
  server.start(() => {
    server.log('INFO', 'Server running on ' + server.info.uri);
  });
};

const error = (err) => {
  server.log('ERROR', 'Server crashed');
  throw err;
};

start()
  .then(loutStart)
  .then(tvStart)
  .then(mongoStart)
  .then(blippStart)
  .then(serverStart)
  .catch(error);
