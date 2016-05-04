const Lab = require('lab');
const lab = exports.lab = Lab.script();

const Jwt = require('jsonwebtoken');
const privateKey = require('../privateKey');

const expect = require('chai').expect;
const describe = lab.describe;
const it = lab.it;
const beforeEach = lab.beforeEach;
const auth = require('../app/plugins/auth/auth').authenticate;

describe('AUTH', () => {
  let error;
  let requestMock;
  let userId;

  let tokenHeader = (userId, options) => {
    options = options || {};

    return 'Bearer ' + Jwt.sign({
        id: userId,
      }, privateKey, options);
  };

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

  beforeEach((done) => {
    userId = '1234567';
    requestMock = {
      id: '1234567890',
      log: (auth, log) => {},
      raw: {
        req: {
          headers: {},
        },
      },
    };
    done();
  });

  it('Should return an Promise', (done) => {
    const res = auth(requestMock);

    expect(res.constructor.name).to.be.equal('Promise');
    done();
  });

  it('Should return an error if the request header doenst contain a token', (done) => {
    const tokenRequired = {
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Token Required',
    };

    auth(requestMock).catch((err) => {
      expect(err.output.statusCode).to.be.equal(tokenRequired.statusCode);
      expect(err.output.payload.message).to.be.equal('Token Required');
      expect(err.output.payload.error).to.be.equal('Unauthorized');
      done();
    });
  });

  it('Should return an error if the request header doenst contain an bearer token ', (done) => {
      const tokenRequired = {
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Bearer Required',
      };

      requestMock.raw.req.headers.authorization = invalidTokenBearer(userId);

      auth(requestMock).catch((err) => {
        expect(err.output.statusCode).to.be.equal(tokenRequired.statusCode);
        expect(err.output.payload.message).to.be.equal(tokenRequired.message);
        expect(err.output.payload.error).to.be.equal(tokenRequired.error);
        done();
      });
    });

  it('Should return an error if the token has an invalid signature', (done) => {
    const tokenRequired = {
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Token Signature is required',
    };

    requestMock.raw.req.headers.authorization = withoutTokenSignature(userId);

    auth(requestMock).catch((err) => {
      expect(err.output.statusCode).to.be.equal(tokenRequired.statusCode);
      expect(err.output.payload.message).to.be.equal(tokenRequired.message);
      expect(err.output.payload.error).to.be.equal(tokenRequired.error);
      done();
    });
  });

  it('Should return an error if the token is invalid', (done) => {
    const tokenRequired = {
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Invalid Token Signature',
    };

    requestMock.raw.req.headers.authorization = invalidTokenKey(userId);

    auth(requestMock).catch((err) => {
      expect(err.output.statusCode).to.be.equal(tokenRequired.statusCode);
      expect(err.output.payload.message).to.be.equal(tokenRequired.message);
      expect(err.output.payload.error).to.be.equal(tokenRequired.error);
      done();
    });
  });

  it('Should return an error if the token doesnt contain an id value', (done) => {
    const tokenRequired = {
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Token ID required',
    };

    requestMock.raw.req.headers.authorization = invalidTokenHeader(userId);

    auth(requestMock).catch((err) => {
      expect(err.output.statusCode).to.be.equal(tokenRequired.statusCode);
      expect(err.output.payload.message).to.be.equal(tokenRequired.message);
      expect(err.output.payload.error).to.be.equal(tokenRequired.error);
      done();
    });
  });

  it('Should return an error if the token is expired', (done) => {
    const tokenRequired = {
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Token Expired',
    };

    requestMock.raw.req.headers.authorization = expiredToken(userId);

    auth(requestMock).catch((err) => {
      expect(err.output.statusCode).to.be.equal(tokenRequired.statusCode);
      expect(err.output.payload.message).to.be.equal(tokenRequired.message);
      expect(err.output.payload.error).to.be.equal(tokenRequired.error);
      done();
    });
  });

  it('Should return the user id if it s a valid token', (done) => {
    requestMock.raw.req.headers.authorization = tokenHeader(userId);

    auth(requestMock).then((res) => {
      expect(res.auth.isAuthenticated).to.be.equal(true);
      expect(res.auth.credentials.id).to.be.equal(userId);
      expect(res.id).to.be.equal(requestMock.id);
      done();
    });
  });
});