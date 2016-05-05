const server = require('../server');

const Lab = require('lab');
const lab = exports.lab = Lab.script();

const Jwt = require('jsonwebtoken');
const privateKey = require('../privateKey');

const expect = require('chai').expect;
const describe = lab.describe;
const it = lab.it;

describe('AUTH', () => {
  let error;

  let invalidTokenHeader = (userId, options) => {
    options = options || {};

    return 'Bearer ' + Jwt.sign({
        anus: userId,
      }, privateKey, options);
  };

  let invalidTokenKey = (userId, options) => {
    options = options || {};

    return 'Bearer ' + Jwt.sign({
        id: userId,
      }, 'invalid private key', options);
  };

  let invalidTokenBearer = (userId, options) => {
    options = options || {};

    return Jwt.sign({
      id: userId,
    }, 'invalid private key', options);
  };

  let withoutTokenSignature = (userId, options) => {
    options = options || {
        algorithm: 'none',
      };

    return 'Bearer ' + Jwt.sign({
        id: userId,
      }, privateKey, options);
  };

  let expiredToken = (userId, options) => {
    options = options || {
        expiresIn: '1',
      };

    return 'Bearer ' + Jwt.sign({
        id: userId,
      }, privateKey, options);
  };

  it('Should return an error if the request header doenst contain a token', (done) => {
    let options = {
      method: 'GET',
      url: '/projects',
    };
    let strError = 'Token Required';

    server.inject(options, (response) => {
      expect(response.statusCode).to.be.equal(401);
      expect(response.result.message).to.be.equal(strError);
      done();
    });
  });

  it('Should return an error if the request header doenst contain an bearer token ', (done) => {
    const bearerRequired = {
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Bearer Required',
    };

    let options = {
      method: 'GET',
      url: '/projects',
      headers: {
        authorization: invalidTokenBearer('1234567890'),
      },
    };

    server.inject(options, (response) => {
      expect(response.result.statusCode).to.be.equal(bearerRequired.statusCode);
      expect(response.result.message).to.be.equal(bearerRequired.message);
      expect(response.result.error).to.be.equal(bearerRequired.error);
      done();
    });
  });

  it('Should return an error if the token has an invalid signature', (done) => {
    const invalidSignature = {
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Invalid Token Signature',
    };

    let options = {
      method: 'GET',
      url: '/projects',
      headers: {
        authorization: invalidTokenKey('1234567890'),
      },
    };

    server.inject(options, (response) => {
      expect(response.result.statusCode).to.be.equal(invalidSignature.statusCode);
      expect(response.result.message).to.be.equal(invalidSignature.message);
      expect(response.result.error).to.be.equal(invalidSignature.error);
      done();
    });
  });

  it('Should return an error if the token is invalid', (done) => {
    const invalidSignature = {
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Token Signature is required',
    };

    let options = {
      method: 'GET',
      url: '/projects',
      headers: {
        authorization: withoutTokenSignature('1234567890'),
      },
    };

    server.inject(options, (response) => {
      expect(response.result.statusCode).to.be.equal(invalidSignature.statusCode);
      expect(response.result.message).to.be.equal(invalidSignature.message);
      expect(response.result.error).to.be.equal(invalidSignature.error);
      done();
    });
  });

  it('Should return an error if the token doesnt contain an id value', (done) => {
    const invalidSignature = {
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Token ID required',
    };

    let options = {
      method: 'GET',
      url: '/projects',
      headers: {
        authorization: invalidTokenHeader('1234567890'),
      },
    };

    server.inject(options, (response) => {
      expect(response.result.statusCode).to.be.equal(invalidSignature.statusCode);
      expect(response.result.message).to.be.equal(invalidSignature.message);
      expect(response.result.error).to.be.equal(invalidSignature.error);
      done();
    });
  });

  it('Should return an error if the token is expired', (done) => {
    const _expiredToken = {
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Token Expired',
    };

    let options = {
      method: 'GET',
      url: '/projects',
      headers: {
        authorization: expiredToken('1234567890'),
      },
    };

    server.inject(options, (response) => {
      expect(response.result.statusCode).to.be.equal(_expiredToken.statusCode);
      expect(response.result.message).to.be.equal(_expiredToken.message);
      expect(response.result.error).to.be.equal(_expiredToken.error);
      done();
    });
  });
});