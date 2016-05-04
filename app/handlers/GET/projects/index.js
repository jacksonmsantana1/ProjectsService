const server = require('../../../../server');
const Boom = require('boom');

const curry = require('ramda').curry;
const compose = require('ramda').compose;
const get = require('ramda').prop;

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

// getProjects ::
const getProjects = require('../../../Project/index').getProjects;

// reply :: Response -> [Project] -> Response([Project])
const response = require('../../../plugins/auth/auth').response;

// sendResponse :: Request -> Response -> [Project] -> Response([Project])
const sendResponse = curry((request, reply, projects) => {
  response(request, reply, projects);
});

// sendError :: Response -> Error -> Response(Error)
const sendError = curry((reply, err) => {
  reply(err);
});

module.exports = (request, reply) => {
  const db = request.server.plugins['hapi-mongodb'].db;
  const collection = db.collection('projects');

  server.methods.authenticate(request)
    .then(isUserValid)
    .then(get('query'))
    .then(get('quantity'))
    .then(getProjects(collection))
    .then(sendResponse(request, reply))
    .catch(sendError(reply));
};
