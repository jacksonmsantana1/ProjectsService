const ProjectDB = require('../app/Project/');

const Lab = require('lab');
const lab = exports.lab = Lab.script();

const sinon = require('sinon');
const expect = require('chai').expect;

const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://127.0.0.1:27017/test';

const describe = lab.describe;
const it = lab.it;
const before = lab.before;
const after = lab.after;

describe('ProjectModel', () => {
  let database;
  let projectsDB;
  let invalidProjectsDB;
  let emptyProjectsDB;
  let usersDB;

  before((done) => {
    MongoClient.connect(url, (err, db) => {
      if (err) {
        done(err);
      }

      console.log('Connected...');
      database = db;
      projectsDB = database.collection('projects');
      invalidProjectsDB = database.collection('invalidProjects');
      emptyProjectsDB = database.collection('empty');
      usersDB = database.collection('users');

      done();
    });
  });

  after((done) => {
    sinon.restore();
    done();
  });

  describe('getProjects(number) -> ', () => {
    it('Should return an promise', (done) => {
      const promise = ProjectDB.getProjects(projectsDB, 1);
      expect(promise.constructor.name).to.be.equal('Promise');
      done();
    });

    it('Should return an error if none attribute is given', (done) => {
     ProjectDB.getProjects(projectsDB, '').catch((err) => {
       expect(err.data).to.be.equal('MongoDB ERROR => Invalid Attribute');
       done();
     });
    });

    it('Should return an error if none database is given', (done) => {
      ProjectDB.getProjects(null, 10)
        .catch((err) => {
          expect(err.data).to.be.equal('MongoDB ERROR => Inexistent DB');
          done();
        });
    });

    it('Should return an number of projects equal to the number parameter', (done) => {
      ProjectDB.getProjects(projectsDB, 2).then((projects) => {
        expect(projects.length).to.be.equal(2);
        done();
      });
    });

    it('Should return only valid Projects', (done) => {
      ProjectDB.getProjects(invalidProjectsDB, 2)
        .catch((err) => {
          expect(err.name).to.be.equal('ValidationError');
          expect(err.details[0].message).to.be.equal('name is required');
          done();
        });
    });

    it('Should return an error if none projects is found', (done) => {
      ProjectDB.getProjects(emptyProjectsDB, 2)
        .catch((err) => {
          expect(err.data).to.be.equal('MongoDB ERROR => No projects found');
          done();
        });
    });
  });
});