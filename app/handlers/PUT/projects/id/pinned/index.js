const Boom = require('boom');
const logMessage = require('../../../../../plugins/logger/');

const curry = require('ramda').curry;
const compose = require('ramda').compose;
const get = require('ramda').prop;
const isNil = require('ramda').isNil;
const isEmpty = require('ramda').isEmpty;

// isAuthenticated :: Request -> Promise(Request, Error)
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

// isValid :: String:id -> Promise(Error, Boolean)
const isValid = require('../../../../../plugins/User/').isValid;

// getCredential :: Request -> String:credential
const getCredential = compose(get('id'), get('credentials'), get('auth'));

// isUserValid :: Request -> Promise(Error, Boolean)
const isUserValid = compose(isValid, getCredential);

// validateUser :: Request -> Boolean -> Promise(Error, Request)
const validateUser = curry((request, ok) =>
  new Promise((resolve, reject) =>
    (ok ? resolve(request) : reject(Boom.unauthorized('Invalid User')))));

// getRequestParams :: Request -> String
const getRequestParams = compose(get('id'), get('params'));

// isRequestParamsValid :: String:params -> Promise(Error, String:params)
const isRequestParamsValid = (params) =>
  new Promise((resolve, reject) => {
    if (isNil(params) || isEmpty(params.trim())) {
      reject(Boom.badRequest('Missing id params'));
    }

    resolve(params);
  });

// getProjectById :: Database:db -> String:params -> Promise(Error, Project)
const getProjectById = require('../../../../../Project/index').getProjectById;

// getProject :: Database:db -> String:params -> Promise(Error, Project)
const getProject = curry((db, params) => getProjectById(db, params)
  .then((project) => Promise.resolve(project))
  .catch((err) => Promise.reject(Boom.badRequest(err.message))));

// sendResponse :: Request -> Response -> String -> Response(Boolean)
const sendResponse = curry((request, reply, pid) => {
  request.log('/projects/{id}/pinned',
    logMessage(request.id, true, request.auth.credentials.id, request.path, 'OK 200'));
  reply(!!pid);
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

  request.log('/projects/{id}/pinned',
    logMessage(request.id, true, request.auth.credentials.id, request.path, 'Endpoint reached'));
  isAuthenticated(request)
    .then(isUserValid)
    .then(validateUser(request))
    .then(getRequestParams)
    .then(isRequestParamsValid)
    .then(getProject(collection))
    .then(sendResponse(request, reply))
    .catch(sendError(request, reply));
};
