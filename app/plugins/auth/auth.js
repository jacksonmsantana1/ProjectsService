const Boom = require('boom');
const logMessage = require('../../plugins/logger/');
const jwt = require('jsonwebtoken');
const KEY = require('../../../privateKey.js');

//ERRORS
const bearerRequired = Boom.unauthorized('Bearer Required');
const tokenRequired = Boom.unauthorized('Token Required');
const invalidSignature = Boom.unauthorized('Invalid Token Signature');
const signatureRequired = Boom.unauthorized('Token Signature is required');
const idRequired = Boom.unauthorized('Token ID required');
const expired = Boom.unauthorized('Token Expired');

/*eslint consistent-return:1*/
const _authenticate = (request, reply) => {
  const req = request.raw.req;
  const authorization = req.headers.authorization;
  const token = authorization && authorization.split(' ')[1];
  const bearer = authorization && authorization.split(' ')[0];

  if (!authorization) {
    request.log('AUTH',
      logMessage(request.id, false, 'undefined', req.url, tokenRequired.message));
    return reply(tokenRequired, null);
  }

  if (bearer !== 'Bearer') {
    request.log('AUTH',
      logMessage(request.id, false, 'undefined', req.url, bearerRequired.message));
    return reply(bearerRequired, null);
  }

  jwt.verify(token, KEY, (err, decoded) => {
    if (err && err.message === 'invalid signature') {
      request.log('AUTH',
        logMessage(request.id, false, 'undefined', req.url, invalidSignature.message));
      return reply(invalidSignature, null);
    } else if (err && err.message === 'jwt signature is required') {
      request.log('AUTH',
        logMessage(request.id, false, 'undefined', req.url, signatureRequired.message));
      return reply(signatureRequired, null);
    } else if (err && err.message === 'jwt expired') {
      request.log('AUTH',
        logMessage(request.id, false, 'undefined', req.url, expired.message));
      return reply(expired, null);
    } else if (!!err && !decoded) {
      request.log('AUTH',
        logMessage(request.id, false, 'undefined', req.url, err.message));
      return reply(Boom.badRequest(err.message), null);
    } else if (!!decoded && !decoded.id) {
      request.log('AUTH',
        logMessage(request.id, false, 'undefined', req.url, idRequired));
      return reply(idRequired, null);
    }

    request.log('AUTH',
      logMessage(request.id, true, decoded.id, req.url, 'Authentication Passed'));
    return reply.continue({ credentials: decoded });
  });
};

const _response = (request, reply) => {
  const options = {
    algorithm: 'HS256',
    expiresIn: 7200000,
  };

  if (!!request && !!request.auth && request.auth.isAuthenticated) {
    request.response
      .header('authorization', 'Bearer ' + jwt.sign(request.auth.credentials, KEY, options));
  }

  reply.continue();
};

/*eslint no-unused-vars:1*/
module.exports = (server, options) => ({
  authenticate: _authenticate,
  response: _response,
});
