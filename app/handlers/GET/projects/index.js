const Boom = require('boom');
const logMessage = require('../../../plugins/logger/');

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

// getCredentials :: Request -> String:id
const getCredentials = compose(get('id'), get('credentials'), get('auth'));

// isValid :: String:id -> Promise(Error, Boolean)
const isValid = require('../../../plugins/User/').isValid;

// isUserValid :: Request -> Promise(Error, Request)
const isUserValid = (request) =>
  new Promise((resolve, reject) => {
    const credential = getCredentials(request);

    /*eslint no-unused-vars:1*/
    isValid(credential)
      .then((ok) => resolve(request))
      .catch((notOk) => reject(Boom.unauthorized('Invalid User')));
  });

// getQueryQuantity :: Request -> Number:quantity
const getQueryQuantity = compose(get('quantity'), get('query'));

// getProjects ::
const getProjects = require('../../../Project/index').getProjects;

// sendResponse :: Request -> Response -> [Project] -> Response([Project])
const sendResponse = curry((request, reply, projects) => {
  request.log('/projects',
    logMessage(request.id, true, request.auth.credentials.id, request.path, 'OK 200'));
  reply(projects);
});

// sendError :: Request -> Response -> Error -> Response(Error)
const sendError = curry((request, reply, err) => {
  request.log('ERROR',
    logMessage(request.id, false, request.auth.credentials.id, request.path, err.message));
  reply(err);
});

module.exports = (request, reply) => {
  const db = request.server.plugins['hapi-mongodb'].db;
  const collection = db.collection('projects');

  request.log('/projects',
    logMessage(request.id, true, request.auth.credentials.id, request.path, 'Endpoint reached'));
  isAuthenticated(request)
    .then(isUserValid)
    .then(getQueryQuantity)
    .then(getProjects(collection))
    .then(sendResponse(request, reply))
    .catch(sendError(request, reply));
};
