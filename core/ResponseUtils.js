const _ = require('lodash');
// Exports functions

function ResponseUtils() {
  //@todo: possible base object we can use as a standard
  this.BaseResponseObjectList = {
    code: '',
    message: '',
    results: {
      rows:[{}],
      count: ''
    }
  };
  this.BaseResponseObject= {
    code: '',
    message: '',
    result: {}
  };

  this.sendInternalServerError = function (response, error, details) {
    printLog(error);
    response.status(500)
      .json({code: 500, message: 'Internal Server Error', dev: error, details: details});
  };

  this.SessionHasExpired = function (res) {
    res.status(401)
      .json({error: 401, message: 'La sesion ha expirado, por favor refresque la página'});
  };

// @todo: add the response each time we can use it for our endpoints
// in this way we can updating the features progressively

  // simple sucess , it shouldn'the return any row
  this.response200Success = function (res, message, rows, details) {
    _.noop(details);
  };
  // New resource created , return object or ID
  this.response201Success = function (res, message, rows, details) {
    _.noop(details);
  };
  // reponse without content to responde
  this.response204Success = function (res, message, rows, details) {
    _.noop(details);
  };
  // Request coudn't be evaluated
  this.response400BadRequest = function (res, message, rows, details) {
    _.noop(details);
  };

  this.response401Unauthorized = function (res, message, rows, details) {
    _.noop(details);
  };
  // Resource doesn't exist
  this.response404NotFound = function (res, message, rows, details) {
    _.noop(details);
  };
  // Validation error
  this.response422Unprocessable = function (res, message, rows, details) {
    _.noop(details);
  };
  // Limit of use exceeded, try again later
  this.response429UseLimitExceeded = function (res, message, rows, details) {
    _.noop(details);
  };

  this.response500ServerError = function (res, message, rows, details) {
    _.noop(details);
  };

  this.response503ServiceNotAvailable = function (res, message, rows, details) {
    _.noop(details);
  };
}

// return the instnas with available methods, the idea is retuning a object of functions
module.exports = new ResponseUtils();

