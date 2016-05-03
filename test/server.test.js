const Lab = require('lab');
const lab = exports.lab = Lab.script();
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

describe('User', () => {
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
      done();
    });
  });

  after((done) => {
    projectsDB.remove({}, () => {
    console.log('\n/******************Finished****************/\n');
    database.close();
    done();
    });
  });

  describe('/projects', () => {
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
  });
});