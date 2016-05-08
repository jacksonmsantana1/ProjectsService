const Boom = require('boom');
const logMessage = require('../../../../../plugins/logger/');

const curry = require('ramda').curry;
const compose = require('ramda').compose;
const get = require('ramda').prop;
const isEmpty = require('ramda').isEmpty;

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

// getUserId :: Request -> String:userId
const getUserId = compose(get('id'), get('credentials'), get('auth'));

// getParamsId :: Request -> String:projectId
const getParamsId = compose(get('id'), get('params'));

// validateParams :: String:projectId -> Boolean
const isValidParams = compose(isEmpty, getParamsId);

// validateParams :: Request -> Promise(Error, Request)
const validateParams = (request) => {
  if (!isValidParams(request)) {
    return Promise.resolve(request);
  }

  return Promise.reject(Boom.badRequest('Invalid Params {id}'));
};

// removeLikes :: Database:db -> String:projectId -> String:userId
const removeLikes = require('../../../../../Project/index').removeLikes;

// removeLikesToProject :: Database:db -> Request -> Promise(Error, Boolean:disliked)
const removeLikesToProject = curry((db, request) => {
  const projectId = getParamsId(request);
  const userId = getUserId(request);

  return removeLikes(db, projectId, userId)
    .then((ok) => Promise.resolve(ok))
    .catch((err) => Promise.reject(Boom.badRequest(err.message)));
});

// sendResponse :: Request -> Response -> Boolean:liked -> Response(Boolean)
const sendResponse = curry((request, reply, liked) => {
  request.log('/projects/{id}/disliked',
    logMessage(request.id, true, request.auth.credentials.id, request.path, 'OK 200'));
  reply(liked);
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

  request.log('/projects/{id}/disliked',
    logMessage(request.id, true, request.auth.credentials.id, request.path, 'Endpoint reached'));
  isAuthenticated(request)
    .then(validateParams)
    .then(removeLikesToProject(collection))
    .then(sendResponse(request, reply))
    .catch(sendError(request, reply));
};
