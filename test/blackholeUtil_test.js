var blackholeUtil = require('../util/blackholeUtil');

// http://stackoverflow.com/a/1830844
function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

exports.testCurrentDateTime = function(test) {
  test.ok(blackholeUtil.currentDateTime() !== null , "Testing to see if we are returning an object.");
  test.ok(isNumber(blackholeUtil.currentDateTime()) , "Testing to see if we are returning is a number.");
  //YYYYmmddHHMMss
  test.ok(blackholeUtil.currentDateTime().toString().length == 14 , "Testing to see if we are returning of length 14.");
  test.done();
};

exports.testCreateTrackingId = function(test) {
  test.ok(blackholeUtil.createTrackingId() !== null, "Testing to see if we are returning an object.");
  test.done();
};

exports.testValidateEmail = function(test) {
  var validEmail = 'test@example.com';
  var invalidEmail = '123';
  test.ok(blackholeUtil.validateEmail(validEmail, function() {}) !== null , "Testing to see if we are returning an object.");
  test.ok(blackholeUtil.validateEmail(invalidEmail, function() {}) !== null , "Testing to see if we are returning an object.");
  test.done();
};