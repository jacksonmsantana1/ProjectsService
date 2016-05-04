const Joi = require('joi');
const Boom = require('boom');
const schema = require('../Project/ProjectModel');

const map = require('ramda').map;
const isEmpty = require('ramda').isEmpty;
const isNil = require('ramda').isNil;
const curry = require('ramda').curry;

// _find :: Database -> Number -> Promise(Cursor)
const _find = curry((db, n) => Promise.resolve(db.find({}).limit(n).toArray()));

// validateCallback :: (Error, Project) -> Promise(Error, Project)
const validateCallback = (err, project) =>
  new Promise((resolve, reject) => {
    if (!!err) {
      reject(Boom.badImplementation('MongoDB Error => Invalid Project', err));
    }

    resolve(project);
  });

// validateSchema :: Project -> Promise(Error, Project)
const validateSchema = (project) => Joi.validate(project, schema, validateCallback);

// validate :: [Projects] -> Promise(Error, [Projects])
const validate = (projects) => Promise.all(map(validateSchema, projects));

// isZeroProjects :: [Project] -> Promise(Error, [Project])
const isZeroProjects = (projects) => {
  if (isEmpty(projects)) {
    return Promise.reject(Boom.badImplementation(null, 'MongoDB ERROR => No projects found'));
  }

  return Promise.resolve(projects);
};

// _getProjects :: Database:db -> Number:limit -> Promise(Error, [Projects])
const _getProjects = curry((db, limit) => new Promise((resolve, reject) => {
  if (isNaN(limit) || isEmpty(limit) || isNil(limit)) {
    reject(Boom.badImplementation(null, 'MongoDB ERROR => Invalid Attribute'));
  } else if (isNil(db) || isEmpty(db)) {
    reject(Boom.badImplementation(null, 'MongoDB ERROR => Inexistent DB'));
  }

  _find(db, limit)
    .then(validate)
    .then(isZeroProjects)
    .then(resolve)
    .catch(reject);
}));

module.exports = {
  getProjects: _getProjects,
};
