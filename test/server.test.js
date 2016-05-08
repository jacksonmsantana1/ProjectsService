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
        done();
      });
    });

    it('Should contain a param called quantity, which tells how many projects to return', (done) => {
      let options = {
        method: 'GET',
        url: '/projects?quantity=2',
        headers: {
          authorization: tokenHeader('1234567'),
        },
      };

      server.inject(options, (response) => {
        expect(response.result.length).to.be.equal(2);
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
        done();
      });
    });

    it('Should return a response with a valid authorization header', (done) => {
      let options = {
        method: 'GET',
        url: '/projects?quantity=2',
        headers: {
          authorization: tokenHeader('1234567'),
        },
      };

      server.inject(options, (response) => {
        expect(!!response.headers.authorization).to.be.equal(true);
        done();
      });
    });
  });

  describe('GET /projects/{id}', () => {
    it('Should be listening to GET /projects/{id}', (done) => {
      let options = {
        method: 'GET',
        url: '/projects/1234',
      };

      server.inject(options, (response) => {
        let res = response.raw.req;

        expect(res.method).to.be.equal('GET');
        expect(res.url).to.be.equal('/projects/1234');
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
        done();
      });
    });

    it('Should return an error if the user doesnt exists', (done) => {
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
        done();
      });
    });

    it('Should return a response with a valid authorization header', (done) => {
      let options = {
        method: 'GET',
        url: '/projects/1',
        headers: {
          authorization: tokenHeader('1234567'),
        },
      };

      server.inject(options, (response) => {
        expect(!!response.headers.authorization).to.be.equal(true);
        done();
      });
    });
  });

  describe('GET /projects/isValid/{id}', () => {
    it('Should be listening to GET /projects/{id}', (done) => {
      let options = {
        method: 'GET',
        url: '/projects/isValid/1',
      };

      server.inject(options, (response) => {
        let res = response.raw.req;

        expect(res.method).to.be.equal('GET');
        expect(res.url).to.be.equal('/projects/isValid/1');
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

    it('Should return an error if no params is given', (done) => {
      let options = {
        method: 'GET',
        url: '/projects/isValid/',
        headers: {
          authorization: tokenHeader('1234567'),
        },
      };

      server.inject(options, (response) => {
        expect(response.result.statusCode).to.be.equal(404);
        done();
      });
    });

    it('Should return an error if the user doesnt exists', (done) => {
      let options = {
        method: 'GET',
        url: '/projects/isValid/1',
        headers: {
          authorization: tokenHeader('DontExist'),
        },
      };

      server.inject(options, (response) => {
        expect(response.result.statusCode).to.be.equal(401);
        expect(response.result.message).to.be.equal('Invalid User');
        expect(response.result.error).to.be.equal('Unauthorized');
        done();
      });
    });

    it('Should return true if the project exists', (done) => {
      let options = {
        method: 'GET',
        url: '/projects/isValid/1',
        headers: {
          authorization: tokenHeader('1234567'),
        },
      };

      server.inject(options, (response) => {
        const result = response.result;
        expect(result).to.be.equal(true);
        done();
      });
    });

    it('Should return false if the projects doesnt exist', (done) => {
      let options = {
        method: 'GET',
        url: '/projects/isValid/1234',
        headers: {
          authorization: tokenHeader('1234567'),
        },
      };

      server.inject(options, (response) => {
        const result = response.result;
        expect(result).to.be.equal(false);
        done();
      });
    });

    it('Should return a response with a valid authorization header', (done) => {
      let options = {
        method: 'GET',
        url: '/projects/isValid/1',
        headers: {
          authorization: tokenHeader('1234567'),
        },
      };

      server.inject(options, (response) => {
        expect(!!response.headers.authorization).to.be.equal(true);
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
        done();
      });
    });

    it('Should return an error if the project doesnt exist', (done) => {
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
        done();
      });
    });

    it('Should return true if everything went OK', (done) => {
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
      let options = {
        method: 'PUT',
        url: '/projects/ /disliked',
        headers: {
          authorization: tokenHeader('1234567'),
        },
      };

      server.inject(options, (response) => {
        expect(response.result.statusCode).to.be.equal(400);
        done();
      });
    });

    it('Should return an error if the project doesnt exist', (done) => {
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
        done();
      });
    });

    it('Should return true if everything went OK', (done) => {
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
        done();
      });
    });
  });
});