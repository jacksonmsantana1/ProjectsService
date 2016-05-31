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

// isRequestParamsValid :: Request -> Promise(Error, Request)
const isRequestParamsValid = (request) =>
  new Promise((resolve, reject) => {
    if (isNil(request.params.id) || isEmpty(request.params.id.trim())) {
      reject(Boom.badRequest('Missing id params'));
    }

    resolve(request);
  });

// addPins :: Database:db -> String:projectId -> String:userId -> Promise(Error, Boolean)
const addPins = require('../../../../../Project/index').addPins;

// pin :: Database:db -> Request -> Promise(Error, Boolean)
const pin = curry((db, request) =>
  addPins(db, getRequestParams(request), getCredential(request))
    .then((ok) => Promise.resolve(ok))
    .catch((err) => Promise.reject(Boom.badRequest(err.message))));

// sendResponse :: Request -> Response -> Boolean -> Response(Boolean)
const sendResponse = curry((request, reply, ok) => {
  request.log('/projects/{id}/pinned',
    logMessage(request.id, true, request.auth.credentials.id, request.path, 'OK 200'));
  reply(ok);
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
    .then(isRequestParamsValid)
    .then(pin(collection))
    .then(sendResponse(request, reply))
    .catch(sendError(request, reply));
};
