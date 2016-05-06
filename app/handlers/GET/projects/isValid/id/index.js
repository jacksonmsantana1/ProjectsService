const Boom = require('boom');
const logMessage = require('../../../../../plugins/logger/');

const curry = require('ramda').curry;
const compose = require('ramda').compose;
const get = require('ramda').prop;

// isAutheticated :: Request -> Promise(Request, Error)
const isAuthenticated = (request) => {
  if (request.auth.error) {
    Promise.reject(request.auth.error);
  }

  if (!!request && !!request.auth) {
    return request.auth.isAuthenticated ? Promise.resolve(request) :
      Promise.reject(request);
  }

  return Promise.error(Boom.badRequest('Invalid Request Object'));
};

// getCredential :: Request -> String:id
const getCredential = compose(get('id'), get('credentials'), get('auth'));

// isValid :: String:id -> Promise(Error, Boolean)
const isValid = require('../../../../../plugins/User/').isValid;

// isUserValid :: Request -> Promise(Error, Boolean)
const isUserValid = compose(isValid, getCredential);

// userOK :: Boolean<true> -> Promise(Error, Request)
const userOK = curry((request, ok) =>
  new Promise((resolve, reject) => {
    ok ? resolve(request) : reject(Boom.unauthorized('Invalid User'));
  }));

//userNotOk :: Error -> Promise(Error)
const userNotOk = (err) =>
  Promise.reject(Boom.badImplementation('Server Communication failed', err));

// validateUser :: Request -> Promise(Error, Request)
const validateUser = (request) => isUserValid(request).then(userOK(request)).catch(userNotOk);

// getProjectId :: Request -> String:id
const getProjectId = compose(get('id'), get('params'));

// getProject :: Database -> String:id -> Promise(Error, Project)
const getProject = require('../../../../../Project/index').getProjectById;

// sendResponse :: Request -> Response -> Project -> Response(Project)
const sendResponse = curry((request, reply, project) => {
  request.log('/projects/isValid/{id}',
    logMessage(request.id, true, request.auth.credentials.id, request.path, 'OK 200'));
  reply(!!project);
});

// sendError :: Request -> Response -> Error -> Response(Error)
const sendError = curry((request, reply, err) => {
  if (err.message === 'MongoDB ERROR => Inexistent Project') {
    reply(false);
  }

  request.log('ERROR',
    logMessage(request.id, false, request.auth.credentials.id, request.path, err.message));
  reply(err);
});

module.exports = (request, reply) => {
  const db = request.server.plugins['hapi-mongodb'].db;
  const collection = db.collection('projects');

  request.log('/projects/isValid/{id}',
    logMessage(request.id, true, request.auth.credentials.id, request.path, 'Endpoint reached'));
  isAuthenticated(request)
    .then(validateUser)
    .then(getProjectId)
    .then(getProject(collection))
    .then(sendResponse(request, reply))
    .catch(sendError(request, reply));
};
