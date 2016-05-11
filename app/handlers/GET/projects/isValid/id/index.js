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

// getProjectId :: Request -> String:id
const getProjectId = compose(get('id'), get('params'));

// getProjectFromDB :: Database -> String:id -> Promise(Error, Project)
const getProjectFromDB = require('../../../../../Project/index').getProjectById;

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
    .then(getProjectId)
    .then(getProjectFromDB(collection))
    .then(sendResponse(request, reply))
    .catch(sendError(request, reply));
};
