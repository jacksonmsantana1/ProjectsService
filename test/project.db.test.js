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

      projectsDB.insert(require('./mock'), (err) => {
        "use strict";
        if (err) {
          throw err;
        }

        console.log('Projects added');
        done();
      });
    });
  });

  after((done) => {
    projectsDB.remove({}, (err) => {
      if (err) {
        throw err;
      }

      sinon.restore();
      done();
    });
  });

  describe('getProjects(number) -> ', () => {
    it('Should return an promise', (done) => {
      const promise = ProjectDB.getProjects(projectsDB, 1);
      expect(promise.constructor.name).to.be.equal('Promise');
      done();
    });

    it('Should return an error if none attribute is given', (done) => {
     ProjectDB.getProjects(projectsDB, '').catch((err) => {
       expect(err.message).to.be.equal('MongoDB ERROR => Invalid Attribute');
       done();
     });
    });

    it('Should return an error if none database is given', (done) => {
      ProjectDB.getProjects(null, 10)
        .catch((err) => {
          expect(err.message).to.be.equal('MongoDB ERROR => Inexistent DB');
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
          expect(err.message).to.be.equal('MongoDB Error => Invalid Project');
          done();
        });
    });

    it('Should return an error if none projects is found', (done) => {
      ProjectDB.getProjects(emptyProjectsDB, 2)
        .catch((err) => {
          expect(err.message).to.be.equal('MongoDB ERROR => No projects found');
          done();
        });
    });
  });

  describe('getProjectById(id) ->', () => {
    it('Should return an promise', (done) => {
      const promise = ProjectDB.getProjectById(projectsDB, '1234');
      expect(promise.constructor.name).to.be.equal('Promise');
      done();
    });

    it('Should return an error if none attribute is given', (done) => {
      ProjectDB.getProjectById(projectsDB, '').catch((err) => {
        expect(err.message).to.be.equal('MongoDB ERROR => Invalid Attribute');
        done();
      });
    });

    it('Should return an error if none database is given', (done) => {
      ProjectDB.getProjectById(null, '1234')
        .catch((err) => {
          expect(err.message).to.be.equal('MongoDB ERROR => Inexistent DB');
          done();
        });
    });

    it('Should return an error if the project doesnt exist', (done) => {
      ProjectDB.getProjectById(projectsDB, '1234')
        .catch((err) => {
          expect(err.message).to.be.equal('MongoDB ERROR => Inexistent Project');
          done();
        });
    });

    it('Should return an error if the project returned isnt valid', (done) => {
      ProjectDB.getProjectById(invalidProjectsDB, '1')
        .catch((err) => {
          expect(err.message).to.be.equal('MongoDB Error => Invalid Project');
          done();
        });
    });

    it('Should return an valid project', (done) => {
      ProjectDB.getProjectById(projectsDB, '1')
        .then((project) => {
          expect(project.id).to.be.equal('1');
          expect(project.name).to.be.equal('Project1');
          done();
        });
    });
  });

  describe('addLikes(projectId, like) ->', () => {
    it('Should return an promise', (done) => {
      const promise = ProjectDB.addLikes(projectsDB, '1234', {});
      expect(promise.constructor.name).to.be.equal('Promise');
      done();
    });

    it('Should return an error if none like object is given', (done) => {
      ProjectDB.addLikes(projectsDB, '1', null).catch((err) => {
        expect(err.message).to.be.equal('MongoDB ERROR => Invalid Attribute:like');
        done();
      });
    });

    it('Should return an error if none project id is given', (done) => {
      ProjectDB.addLikes(projectsDB, '', { like: 'ANUS'}).catch((err) => {
        expect(err.message).to.be.equal('MongoDB ERROR => Invalid Attribute:projectId');
        done();
      });
    });

    it('Should return an error if none database is given', (done) => {
      ProjectDB.addLikes(null, '1234', { like: 'ANUS' })
        .catch((err) => {
          expect(err.message).to.be.equal('MongoDB ERROR => Inexistent DB');
          done();
        });
    });

    it('Should return an error if the project doesnt exist', (done) => {
      ProjectDB.addLikes(projectsDB, '1234', { like: 'ANUS' })
        .catch((err) => {
          expect(err.message).to.be.equal('MongoDB ERROR => Inexistent Project');
          done();
        });
    });

    it('Should return true if everything runs OK', (done) => {
      ProjectDB.addLikes(projectsDB, '1', { user: '1234567', creationDate: new Date() })
        .then((ok) => {
          console.log(ok);
          expect(ok).to.be.equal(true);
          return ProjectDB.getProjectById(projectsDB, '1')
        })
        .then((doc) => {
          console.log(doc);
          expect(doc.id).to.be.equal('1');
          expect(doc.liked[2].user).to.be.equal('1234567');
          done();
        });
    });
  });

  describe('removeLikes(projectId, userId) ->', () => {
    it('Should return an promise', (done) => {
      const promise = ProjectDB.removeLikes(projectsDB, '1234', {});
      expect(promise.constructor.name).to.be.equal('Promise');
      done();
    });

    it('Should return an error if none user id is given', (done) => {
      ProjectDB.removeLikes(projectsDB, '1', null).catch((err) => {
        expect(err.message).to.be.equal('MongoDB ERROR => Invalid Attribute:userId');
        done();
      });
    });

    it('Should return an error if none project id is given', (done) => {
      ProjectDB.removeLikes(projectsDB, '', '1234567').catch((err) => {
        expect(err.message).to.be.equal('MongoDB ERROR => Invalid Attribute:projectId');
        done();
      });
    });

    it('Should return an error if none database is given', (done) => {
      ProjectDB.removeLikes(null, '1234', '1234567')
        .catch((err) => {
          expect(err.message).to.be.equal('MongoDB ERROR => Inexistent DB');
          done();
        });
    });

    it('Should return an error if the project doesnt exist', (done) => {
      ProjectDB.removeLikes(projectsDB, '1234', '1234567')
        .catch((err) => {
          expect(err.message).to.be.equal('MongoDB ERROR => Inexistent Project');
          done();
        });
    });

    it('Should return true if everything runs OK', (done) => {
      ProjectDB.removeLikes(projectsDB, '1', '1234567')
        .then((ok) => {
          expect(ok).to.be.equal(true);
          return ProjectDB.getProjectById(projectsDB, '1');
        })
        .then((doc) => {
          console.log(doc);
          expect(doc.liked.length).to.be.equal(1);
          done();
        });
    });
  });
});