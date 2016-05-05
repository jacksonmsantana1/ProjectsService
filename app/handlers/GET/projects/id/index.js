const Boom = require('boom');
const logMessage = require('../../../../plugins/logger/');

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

// getCredential :: Request -> String:credential
const getCredential = compose(get('id'), get('credentials'), get('auth'));

// isValid :: String:id -> Promise(Error, Boolean)
const isValid = require('../../../../plugins/User/').isValid;

// isUserValid :: Request -> Promise(Error, Request)
const isUserValid = (req) =>
  new Promise((resolve, reject) => {
    isValid(getCredential(req))
      .then((ok) => resolve(req)) /*eslint no-unused-vars:1*/
      .catch((notOk) => reject(Boom.unauthorized('Invalid User')));
  });

// getProjectId :: Request -> String:id
const getProjectId = compose(get('id'), get('params'));

// getProject :: Database -> String:id -> Promise(Error, Project)
const getProject = require('../../../../Project/index').getProjectById;

// sendResponse :: Request -> Response -> Project -> Response(Project)
const sendResponse = curry((request, reply, project) => {
  request.log('/projects/{id}',
    logMessage(request.id, true, request.auth.credentials.id, request.path, 'OK 200'));
  reply(project);
});

// sendError :: Request -> Response -> Error -> Response(Error)
const sendError = curry((request, reply, err) => {
  if (err.message === 'MongoDB ERROR => Inexistent Project') {
    reply(Boom.badRequest(err.message));
  }

  request.log('ERROR',
    logMessage(request.id, false, request.auth.credentials.id, request.path, err.message));
  reply(err);
});

module.exports = (request, reply) => {
  const db = request.server.plugins['hapi-mongodb'].db;
  const collection = db.collection('projects');

  request.log('/projects/{id}',
    logMessage(request.id, true, request.auth.credentials.id, request.path, 'Endpoint reached'));
  isAuthenticated(request)
    .then(isUserValid)
    .then(getProjectId)
    .then(getProject(collection))
    .then(sendResponse(request, reply))
    .catch(sendError(request, reply));
};
