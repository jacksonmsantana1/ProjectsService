const Joi = require('joi');
const schema = require('../Project/ProjectModel');

const map = require('ramda').map;
const isEmpty = require('ramda').isEmpty;
const isNil = require('ramda').isNil;
const curry = require('ramda').curry;
const nth = require('ramda').nth;

// _find :: Database -> Number -> Promise(Cursor)
const _find = curry((db, n) => Promise.resolve(db.find({}).limit(n).toArray()));

// _findById :: Database -> String -> Promise(Cursor)
const _findById = curry((db, _id) => Promise.resolve(db.find({ id: _id }).toArray()));

// validateCallback :: (Error, Project) -> Promise(Error, Project)
const validateCallback = (err, project) =>
  new Promise((resolve, reject) => {
    if (!!err) {
      reject(new Error('MongoDB Error => Invalid Project'));
    }

    resolve(project);
  });

// validateSchema :: Project -> Promise(Error, Project)
const validateSchema = (project) => Joi.validate(project, schema, validateCallback);

// validate :: [Projects] -> Promise(Error, [Projects])
const validate = (projects) => Promise.all(map(validateSchema, projects));

// isZeroProjects :: [Project] -> Promise(Error, [Project])
const isZeroProjects = (projects) => {
  if (isEmpty(projects || isNil(projects))) {
    return Promise.reject(new Error('MongoDB ERROR => No projects found'));
  }

  return Promise.resolve(projects);
};

// validateOneProject :: Project -> Promise(Error, Project)
const validateOneProject = (project) => {
  if (isNil(project) || isEmpty(project)) {
    return Promise.reject(new Error('MongoDB ERROR => Inexistent Project'));
  }

  return Promise.resolve(project);
};

// _getProjects :: Database:db -> Number:limit -> Promise(Error, [Projects])
const _getProjects = curry((db, limit) =>
  new Promise((resolve, reject) => {
    if (isNaN(limit) || isEmpty(limit) || isNil(limit)) {
      reject(new Error('MongoDB ERROR => Invalid Attribute'));
    } else if (isNil(db) || isEmpty(db)) {
      reject(new Error('MongoDB ERROR => Inexistent DB'));
    }

    _find(db, limit)
      .then(validate)
      .then(isZeroProjects)
      .then(resolve)
      .catch(reject);
  }));

// _getProjectById :: Database:db -> String:id -> Promise(Error, Project)
const _getProjectById = curry((db, id) =>
  new Promise((resolve, reject) => {
    if (isEmpty(id) || isNil(id)) {
      reject(new Error('MongoDB ERROR => Invalid Attribute'));
    } else if (isNil(db) || isEmpty(db)) {
      reject(new Error('MongoDB ERROR => Inexistent DB'));
    }

    _findById(db, id)
      .then(nth(0))
      .then(validateOneProject)
      .then(validateSchema)
      .then(resolve)
      .catch(reject);
  }));

module.exports = {
  getProjects: _getProjects,
  getProjectById: _getProjectById,
};
