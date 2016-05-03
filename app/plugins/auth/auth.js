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
const _authenticate = (request) => (new Promise((resolve, reject) => {
  const req = request.raw.req;
  const authorization = req.headers.authorization;
  const token = authorization && authorization.split(' ')[1];
  const bearer = authorization && authorization.split(' ')[0];

  if (!authorization) {
    request.log('AUTH',
      logMessage(request.id, false, 'undefined', req.url, tokenRequired.message));
    reject(tokenRequired);
  }

  if (bearer !== 'Bearer') {
    request.log('AUTH',
      logMessage(request.id, false, 'undefined', req.url, bearerRequired.message));
    reject(bearerRequired);
  }

  jwt.verify(token, KEY, (err, decoded) => {
    if (err && err.message === 'invalid signature') {
      request.log('AUTH',
        logMessage(request.id, false, 'undefined', req.url, invalidSignature.message));
      reject(invalidSignature);
    } else if (err && err.message === 'jwt signature is required') {
      request.log('AUTH',
        logMessage(request.id, false, 'undefined', req.url, signatureRequired.message));
      reject(signatureRequired);
    } else if (err && err.message === 'jwt expired') {
      request.log('AUTH',
        logMessage(request.id, false, 'undefined', req.url, expired.message));
      reject(expired);
    } else if (!!err && !decoded) {
      request.log('AUTH',
        logMessage(request.id, false, 'undefined', req.url, err.message));
      reject(Boom.badRequest(err.message));
    } else if (!!decoded && !decoded.id) {
      request.log('AUTH',
        logMessage(request.id, false, 'undefined', req.url, idRequired));
      reject(idRequired);
    } else if (!!decoded) {
      request.log('AUTH',
        logMessage(request.id, true, decoded.id, req.url, 'Authentication Passed'));
      resolve({ credentials: decoded });
    }
  });
}));

const _response = (request, next) => {
  const options = {
    algorithm: 'HS256',
    expiresIn: 7200000,
  };

  if (!!request && !!request.auth && request.auth.isAuthenticated) {
    request.response
      .header('authorization', 'Bearer ' + jwt.sign(request.auth.credentials, KEY, options));
  }

  next(true);
};

module.exports = {
  authenticate: _authenticate,
  response: _response,
};
