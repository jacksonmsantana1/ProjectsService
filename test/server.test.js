const Lab = require('lab');
const lab = exports.lab = Lab.script();

const sinon = require('sinon');
const expect = require('chai').expect;

const Jwt = require('jsonwebtoken');
const privateKey = require('../privateKey.js');

const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://127.0.0.1:27017/test';

const describe = lab.describe;
const it = lab.it;
const before = lab.before;
const after = lab.after;

const server = require('../server.js');
const Project = require('../app/Project/');
const Wreck = require('wreck');
const Boom = require('boom');

describe('User', () => {
  let tokenHeader = (userId, options) => {
    options = options || {};

    return 'Bearer ' + Jwt.sign({
      id: userId,
    }, privateKey, options);
  };

  let invalidTokenKey = (userId, options) => {
    options = options || {};

    return 'Bearer ' + Jwt.sign({
        id: userId,
      }, 'invalid private key', options);
  };

  let projectsDB;
  let database;

  before((done) => {
    MongoClient.connect(url, (err, db) => {
      if (err) {
        done(err);
      }

      console.log('Connected...');
      database = db;
      projectsDB = database.collection('projects');

      projectsDB.insert(require('./mock'), (err) => {
        if (err) {
          throw err;
        }

        done();
        console.log('Added projects');
      });
    });
  });

  after((done) => {
    projectsDB.remove({}, (err) => {
      if (err) {
        throw err
      }

      sinon.restore();
      done();
    });
  });

  describe('GET /projects', () => {
    it('Should be listening to GET /projects', (done) => {
      let options = {
        method: 'GET',
        url: '/projects',
      };

      server.inject(options, (response) => {
        let res = response.raw.req;

        expect(res.method).to.be.equal('GET');
        expect(res.url).to.be.equal('/projects');
        done();
      });
    });

    it('Should be expecting a valid token for authentication', (done) => {
      let options = {
        method: 'GET',
        url: '/projects?quantity=2',
        headers: {
          authorization: invalidTokenKey('1234567'),
        },
      };

      server.inject(options, (response) => {
        const result = response.result;
        expect(result.statusCode).to.be.equal(401);
        expect(result.error).to.be.equal('Unauthorized');
        expect(result.message).to.be.equal('Invalid Token Signature');
        done();
      });
    });

    it('Should return an error if the user doesnt exists', (done) => {
      const stub = sinon.stub(Wreck, 'get', (uri, options, cb) => {
        return cb(null, { statusCode: 200 }, false);
      });

      let options = {
        method: 'GET',
        url: '/projects?quantity=2',
        headers: {
          authorization: tokenHeader('DontExist'),
        },
      };

      server.inject(options, (response) => {
        expect(response.result.statusCode).to.be.equal(401);
        expect(response.result.message).to.be.equal('Invalid User');
        expect(response.result.error).to.be.equal('Unauthorized');
        stub.restore();
        done();
      });
    });

    it('Should contain a param called quantity, which tells how many projects to return', (done) => {
      const stub = sinon.stub(Wreck, 'get', (uri, options, cb) => {
        return cb(null, { statusCode: 200 }, true);
      });

      let options = {
        method: 'GET',
        url: '/projects?quantity=2',
        headers: {
          authorization: tokenHeader('1234567'),
        },
      };

      server.inject(options, (response) => {
        expect(response.result.length).to.be.equal(2);
        stub.restore();
        done();
      });
    });

    it('Should return an error if the param quantity is not a number', (done) => {
      let options = {
        method: 'GET',
        url: '/projects?quantity=ANUS',
        headers: {
          authorization: tokenHeader('1234567'),
        },
      };

      server.inject(options, (response) => {
        expect(response.result.statusCode).to.be.equal(400);
        expect(response.result.message).to.be.equal('child "quantity" fails because [quantity must be a number]');
        expect(response.result.validation.source).to.be.equal('query');
        done();
      });
    });

    it('Should return an array of projects if everything is alright', (done) => {
      const stub = sinon.stub(Wreck, 'get', (uri, options, cb) => {
        return cb(null, { statusCode: 200 }, true);
      });

      let options = {
        method: 'GET',
        url: '/projects?quantity=2',
        headers: {
          authorization: tokenHeader('1234567'),
        },
      };

      server.inject(options, (response) => {
        expect(response.result[0].id).to.be.equal('1');
        expect(response.result[0].name).to.be.equal('Project1');
        expect(response.result[1].id).to.be.equal('2');
        expect(response.result[1].name).to.be.equal('Project2');
        stub.restore();
        done();
      });
    });

    it('Should return a response with a valid authorization header', (done) => {
      const stub = sinon.stub(Wreck, 'get', (uri, options, cb) => {
        return cb(null, { statusCode: 200 }, true);
      });

      let options = {
        method: 'GET',
        url: '/projects?quantity=2',
        headers: {
          authorization: tokenHeader('1234567'),
        },
      };

      server.inject(options, (response) => {
        expect(!!response.headers.authorization).to.be.equal(true);
        stub.restore();
        done();
      });
    });
  });

  describe('GET /projects/{id}', () => {
    it('Should be listening to GET /projects/{id}', (done) => {
      const stub = sinon.stub(Wreck, 'get', (uri, options, cb) => {
        return cb(null, { statusCode: 200 }, true);
      });

      let options = {
        method: 'GET',
        url: '/projects/1234',
      };

      server.inject(options, (response) => {
        let res = response.raw.req;

        expect(res.method).to.be.equal('GET');
        expect(res.url).to.be.equal('/projects/1234');
        stub.restore();
        done();
      });
    });

    it('Should be expecting a valid token for authentication', (done) => {
      let options = {
        method: 'GET',
        url: '/projects/1234',
        headers: {
          authorization: invalidTokenKey('1234567'),
        },
      };

      server.inject(options, (response) => {
        const result = response.result;
        expect(result.statusCode).to.be.equal(401);
        expect(result.error).to.be.equal('Unauthorized');
        expect(result.message).to.be.equal('Invalid Token Signature');
        done();
      });
    });

    it('Should return an error if the projects doesnt exist', (done) => {
      const stub = sinon.stub(Wreck, 'get', (uri, options, cb) => {
        return cb(null, { statusCode: 200 }, true);
      });

      let options = {
        method: 'GET',
        url: '/projects/1234',
        headers: {
          authorization: tokenHeader('1234567'),
        },
      };

      server.inject(options, (response) => {
        const result = response.result;
        expect(result.message).to.be.equal('MongoDB ERROR => Inexistent Project');
        expect(result.statusCode).to.be.equal(400);
        expect(result.error).to.be.equal('Bad Request');
        stub.restore();
        done();
      });
    });

    it('Should return an error if the user doesnt exists', (done) => {
      const stub = sinon.stub(Wreck, 'get', (uri, options, cb) => {
        return cb(null, { statusCode: 200 }, false);
      });
      let options = {
        method: 'GET',
        url: '/projects/1',
        headers: {
          authorization: tokenHeader('DontExist'),
        },
      };

      server.inject(options, (response) => {
        expect(response.result.statusCode).to.be.equal(401);
        expect(response.result.message).to.be.equal('Invalid User');
        expect(response.result.error).to.be.equal('Unauthorized');
        stub.restore();
        done();
      });
    });

    it('Should return an error if no params is given', (done) => {
      let options = {
        method: 'GET',
        url: '/projects/',
        headers: {
          authorization: tokenHeader('1234567'),
        },
      };

      server.inject(options, (response) => {
        expect(response.result.statusCode).to.be.equal(404);
        done();
      });
    });

    it('Should return the project if everything is alright', (done) => {
      const stub = sinon.stub(Wreck, 'get', (uri, options, cb) => {
        return cb(null, { statusCode: 200 }, true);
      });

      let options = {
        method: 'GET',
        url: '/projects/1',
        headers: {
          authorization: tokenHeader('1234567'),
        },
      };

      server.inject(options, (response) => {
        expect(response.result.id).to.be.equal('1');
        expect(response.result.name).to.be.equal('Project1');
        stub.restore();
        done();
      });
    });

    it('Should return a response with a valid authorization header', (done) => {
      const stub = sinon.stub(Wreck, 'get', (uri, options, cb) => {
        return cb(null, { statusCode: 200 }, true);
      });

      let options = {
        method: 'GET',
        url: '/projects/1',
        headers: {
          authorization: tokenHeader('1234567'),
        },
      };

      server.inject(options, (response) => {
        expect(!!response.headers.authorization).to.be.equal(true);
        stub.restore();
        done();
      });
    });
  });

  describe('GET /projects/isValid/{id}  ADMIN', () => {
    it('Should be listening to GET /projects/{id}', (done) => {
      const stub = sinon.stub(Wreck, 'get', (uri, options, cb) => {
        return cb(null, { statusCode: 200 }, true);
      });

      let options = {
        method: 'GET',
        url: '/projects/isValid/1',
      };

      server.inject(options, (response) => {
        let res = response.raw.req;

        expect(res.method).to.be.equal('GET');
        expect(res.url).to.be.equal('/projects/isValid/1');
        stub.restore();
        done();
      });
    });

    it('Should be expecting a valid token for authentication', (done) => {
      let options = {
        method: 'GET',
        url: '/projects/isValid/1',
        headers: {
          authorization: invalidTokenKey('1234567'),
        },
      };

      server.inject(options, (response) => {
        const result = response.result;
        expect(result.statusCode).to.be.equal(401);
        expect(result.error).to.be.equal('Unauthorized');
        expect(result.message).to.be.equal('Invalid Token Signature');
        done();
      });
    });

    it('Should return an error if the request is made by a not admin user', (done) => {
      const stub = sinon.stub(Wreck, 'get', (uri, options, cb) => {
        return cb(null, { statusCode: 200 }, false);
      });

      let options = {
        method: 'GET',
        url: '/projects/isValid/1',
        headers: {
          authorization: tokenHeader('notAdmin'),
        },
      };

      server.inject(options, (response) => {
        expect(response.statusCode).to.be.equal(403);
        expect(JSON.parse(response.payload).message)
          .to.be.equal('Normal User not allowed');
        stub.restore();
        done();
      });
    });

    it('Should return an error if the user doesnt exist', (done) => {
      const stub = sinon.stub(Wreck, 'get', (uri, options, cb) => {
        return cb(null, { statusCode: 401 }, Boom.unauthorized('Inexistent User'));
      });

      let options = {
        method: 'GET',
        url: '/projects/isValid/1',
        headers: {
          authorization: tokenHeader('inexistentUser'),
        },
      };

      server.inject(options, (response) => {
        expect(response.statusCode).to.be.equal(401);
        expect(JSON.parse(response.payload).message)
          .to.be.equal('Inexistent User');
        stub.restore();
        done();
      });
    });

    it('Should return an error if no params is given', (done) => {
      let options = {
        method: 'GET',
        url: '/projects/isValid/',
        headers: {
          authorization: require('../admin'),
        },
      };

      server.inject(options, (response) => {
        expect(response.result.statusCode).to.be.equal(404);
        done();
      });
    });

    it('Should return true if the project exists', (done) => {
      const stub = sinon.stub(Wreck, 'get', (uri, options, cb) => {
        return cb(null, { statusCode: 200 }, true);
      });

      let options = {
        method: 'GET',
        url: '/projects/isValid/1',
        headers: {
          authorization: tokenHeader('postmanAdmin'),
        },
      };

      require('fs').writeFile('info.log', require('../admin'), () => {
        server.inject(options, (response) => {
          const result = response.result;
          expect(result).to.be.equal(true);
          stub.restore();
          done();
        });
      });
    });

    it('Should return false if the projects doesnt exist', (done) => {
      const stub = sinon.stub(Wreck, 'get', (uri, options, cb) => {
        return cb(null, { statusCode: 200 }, true);
      });

      let options = {
        method: 'GET',
        url: '/projects/isValid/1234',
        headers: {
          authorization: tokenHeader('postmanAdmin'),
        },
      };

      server.inject(options, (response) => {
        const result = response.result;
        expect(result).to.be.equal(false);
        stub.restore();
        done();
      });
    });
  });

  describe('PUT /projects/{id}/liked', () => {
    it('Should be listening to PUT /projects/{id}/liked', (done) => {
      let options = {
        method: 'PUT',
        url: '/projects/1/liked',
      };

      server.inject(options, (response) => {
        let res = response.raw.req;

        expect(res.method).to.be.equal('PUT');
        expect(res.url).to.be.equal('/projects/1/liked');
        done();
      });
    });

    it('Should be expecting a valid token for authentication', (done) => {
      let options = {
        method: 'PUT',
        url: '/projects/1/liked',
        headers: {
          authorization: invalidTokenKey('1234567'),
        },
      };

      server.inject(options, (response) => {
        const result = response.result;
        expect(result.statusCode).to.be.equal(401);
        expect(result.error).to.be.equal('Unauthorized');
        expect(result.message).to.be.equal('Invalid Token Signature');
        done();
      });
    });

    it('Should return an error if the user doesnt exists', (done) => {
      const stub = sinon.stub(Wreck, 'get', (uri, options, cb) => {
        return cb(null, { statusCode: 200 }, false);
      });

      let options = {
        method: 'PUT',
        url: '/projects/1/liked',
        headers: {
          authorization: tokenHeader('DontExist'),
        },
      };

      server.inject(options, (response) => {
        expect(response.result.statusCode).to.be.equal(401);
        expect(response.result.message).to.be.equal('Invalid User');
        expect(response.result.error).to.be.equal('Unauthorized');
        stub.restore();
        done();
      });
    });

    it('Should return an error if the project doesnt exist', (done) => {
      const stub = sinon.stub(Wreck, 'get', (uri, options, cb) => {
        return cb(null, { statusCode: 200 }, true);
      });

      let options = {
        method: 'PUT',
        url: '/projects/214341234/liked',
        headers: {
          authorization: tokenHeader('1234567'),
        },
      };

      server.inject(options, (response) => {
        expect(response.result.statusCode).to.be.equal(400);
        expect(response.result.message).to.be.equal('MongoDB ERROR => Inexistent Project');
        expect(response.result.error).to.be.equal('Bad Request');
        stub.restore();
        done();
      });
    });

    it('Should return true if everything went OK', (done) => {
      const stub = sinon.stub(Wreck, 'get', (uri, options, cb) => {
        return cb(null, { statusCode: 200 }, true);
      });

      let options = {
        method: 'PUT',
        url: '/projects/1/liked',
        headers: {
          authorization: tokenHeader('1234567'),
        },
      };

      server.inject(options, (response) => {
        expect(response.statusCode).to.be.equal(200);
        expect(response.result).to.be.equal(true);
        stub.restore();
        done();
      });
    });
  });

  describe('PUT /projects/{id}/disliked', () => {
    it('Should be listening to PUT /projects/{id}/liked', (done) => {
      let options = {
        method: 'PUT',
        url: '/projects/1/disliked',
      };

      server.inject(options, (response) => {
        let res = response.raw.req;

        expect(res.method).to.be.equal('PUT');
        expect(res.url).to.be.equal('/projects/1/disliked');
        done();
      });
    });

    it('Should be expecting a valid token for authentication', (done) => {
      let options = {
        method: 'PUT',
        url: '/projects/1/disliked',
        headers: {
          authorization: invalidTokenKey('1234567'),
        },
      };

      server.inject(options, (response) => {
        const result = response.result;
        expect(result.statusCode).to.be.equal(401);
        expect(result.error).to.be.equal('Unauthorized');
        expect(result.message).to.be.equal('Invalid Token Signature');
        done();
      });
    });

    it('Should return an error if no params is given', (done) => {
      const stub = sinon.stub(Wreck, 'get', (uri, options, cb) => {
        return cb(null, { statusCode: 200 }, true);
      });

      let options = {
        method: 'PUT',
        url: '/projects/ /disliked',
        headers: {
          authorization: tokenHeader('1234567'),
        },
      };

      server.inject(options, (response) => {
        expect(response.result.statusCode).to.be.equal(400);
        stub.restore();
        done();
      });
    });

    it('Should return an error if the user doesnt exists', (done) => {
      const stub = sinon.stub(Wreck, 'get', (uri, options, cb) => {
        return cb(null, { statusCode: 200 }, false);
      });

      let options = {
        method: 'PUT',
        url: '/projects/1/disliked',
        headers: {
          authorization: tokenHeader('DontExist'),
        },
      };

      server.inject(options, (response) => {
        expect(response.result.statusCode).to.be.equal(401);
        expect(response.result.message).to.be.equal('Invalid User');
        expect(response.result.error).to.be.equal('Unauthorized');
        stub.restore();
        done();
      });
    });

    it('Should return an error if the project doesnt exist', (done) => {
      const stub = sinon.stub(Wreck, 'get', (uri, options, cb) => {
        return cb(null, { statusCode: 200 }, true);
      });

      let options = {
        method: 'PUT',
        url: '/projects/214341234/disliked',
        headers: {
          authorization: tokenHeader('1234567'),
        },
      };

      server.inject(options, (response) => {
        expect(response.result.statusCode).to.be.equal(400);
        expect(response.result.message).to.be.equal('MongoDB ERROR => Inexistent Project');
        expect(response.result.error).to.be.equal('Bad Request');
        stub.restore();
        done();
      });
    });

    it('Should return true if everything went OK', (done) => {
      const stub = sinon.stub(Wreck, 'get', (uri, options, cb) => {
        return cb(null, { statusCode: 200 }, true);
      });

      let options = {
        method: 'PUT',
        url: '/projects/1/disliked',
        headers: {
          authorization: tokenHeader('1234567'),
        },
      };

      server.inject(options, (response) => {
        expect(response.statusCode).to.be.equal(200);
        expect(response.result).to.be.equal(true);
        stub.restore();
        done();
      });
    });

    it('Should return an error if the project was already disliked by the user', (done) => {
      const stub = sinon.stub(Wreck, 'get', (uri, options, cb) => {
        return cb(null, { statusCode: 200 }, true);
      });

      let options = {
        method: 'PUT',
        url: '/projects/2/disliked',
        headers: {
          authorization: tokenHeader('1234567'),
        },
      };

      server.inject(options, (response) => {
        expect(response.result.statusCode).to.be.equal(400);
        expect(response.result.message).to.be.equal('ALready removed the like');
        expect(response.result.error).to.be.equal('Bad Request');
        stub.restore();
        done();
      });
    });
  });

  describe('PUT /projects/{id}/pinned', () => {
    it('Should be listening to PUT /projects/{id}/pinned', (done) => {
      let options = {
        method: 'PUT',
        url: '/projects/1/pinned',
      };

      server.inject(options, (response) => {
        let res = response.raw.req;

        expect(res.method).to.be.equal('PUT');
        expect(res.url).to.be.equal('/projects/1/pinned');
        done();
      });
    });

    it('Should be expecting a valid token for authentication', (done) => {
      let options = {
        method: 'PUT',
        url: '/projects/1/pinned',
        headers: {
          authorization: invalidTokenKey('1234567'),
        },
      };

      server.inject(options, (response) => {
        const result = response.result;
        expect(result.statusCode).to.be.equal(401);
        expect(result.error).to.be.equal('Unauthorized');
        expect(result.message).to.be.equal('Invalid Token Signature');
        done();
      });
    });

    it('Should return an error if no params is given', (done) => {
      const stub = sinon.stub(Wreck, 'get', (uri, options, cb) => {
        return cb(null, { statusCode: 200 }, true);
      });

      let options = {
        method: 'PUT',
        url: '/projects/ /pinned',
        headers: {
          authorization: tokenHeader('1234567'),
        },
      };

      server.inject(options, (response) => {
        expect(response.result.statusCode).to.be.equal(400);
        expect(response.result.message).to.be.equal('Missing id params');
        stub.restore();
        done();
      });
    });

    it('Should return an error if the user making the request is not valid', (done) => {
      const stub = sinon.stub(Wreck, 'get', (uri, options, cb) => {
        return cb(null, { statusCode: 200 }, false);
      });

      let options = {
        method: 'PUT',
        url: '/projects/1/pinned',
        headers: {
          authorization: tokenHeader('DontExist'),
        },
      };

      server.inject(options, (response) => {
        expect(response.result.statusCode).to.be.equal(401);
        expect(response.result.message).to.be.equal('Invalid User');
        expect(response.result.error).to.be.equal('Unauthorized');
        stub.restore();
        done();
      });
    });

    it('Should return an error if the project with the given id doesnt exist', (done) => {
      const stub = sinon.stub(Wreck, 'get', (uri, options, cb) => {
        return cb(null, { statusCode: 200 }, true);
      });

      let options = {
        method: 'PUT',
        url: '/projects/1235234/pinned',
        headers: {
          authorization: tokenHeader('1234567'),
        },
      };

      server.inject(options, (response) => {
        expect(response.result.statusCode).to.be.equal(400);
        expect(response.result.message).to.be.equal('MongoDB ERROR => Inexistent Project');
        stub.restore();
        done();
      });
    });

    it('Should return true if everything went alright', (done) => {
      const stub = sinon.stub(Wreck, 'get', (uri, options, cb) => {
        return cb(null, { statusCode: 200 }, true);
      });

      let options = {
        method: 'PUT',
        url: '/projects/1/pinned',
        headers: {
          authorization: tokenHeader('1234567'),
        },
      };

      server.inject(options, (response) => {
        expect(response.statusCode).to.be.equal(200);
        stub.restore();
        done();
      });
    });
  });
});