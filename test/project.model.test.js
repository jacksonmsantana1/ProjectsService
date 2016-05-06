const Joi = require('joi');
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const expect = require('chai').expect;
const schema = require('../app/Project/ProjectModel');

const describe = lab.describe;
const it = lab.it;

describe('ProjectModel', () => {
  let project = require('./mock')[2];

  describe('Model Validation', () => {
    it('Should return true', (done) => {
      Joi.validate(project, schema, (err, value) => {
        expect(!!value).to.be.equal(true);
        done();
      });
    });
  });
});
