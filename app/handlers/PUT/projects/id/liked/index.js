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

// getParamsId :: Request -> String:projectId
const getParamsId = compose(get('id'), get('params'));

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

// createLike :: Request -> Object:like
const createLike = (request) => ({
  user: getCredential(request),
  date: new Date(),
});

// addLikes :: Database:db -> String:projectId -> Object:like -> Promise(Error, Boolean:liked)
const addLikes = require('../../../../../Project/index').addLikes;

// addLikesToProject :: Request -> Promise(Error, Boolean:liked)
const addLikesToProject = curry((db, request) => {
  const projectId = getParamsId(request);
  const like = createLike(request);

  return addLikes(db, projectId, like)
    .then((ok) => Promise.resolve(ok))
    .catch((err) => Promise.reject(Boom.badRequest(err.message)));
});

// sendResponse :: Request -> Response -> Boolean:liked -> Response(Boolean)
const sendResponse = curry((request, reply, liked) => {
  request.log('/projects/{id}/liked',
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

  request.log('/projects/{id}/liked',
    logMessage(request.id, true, request.auth.credentials.id, request.path, 'Endpoint reached'));
  isAuthenticated(request)
    .then(validateUser)
    .then(addLikesToProject(collection))
    .then(sendResponse(request, reply))
    .catch(sendError(request, reply));
};
