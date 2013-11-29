var crypto = require('crypto');

exports.currentDateTime = function() {
    var currentDate = new Date();
    var dateTime = '' + currentDate.getFullYear() +
                     (((currentDate.getMonth()+1) < 10)?"0":"") + (currentDate.getMonth()+1) +
                      ((currentDate.getDate() < 10)?"0":"") + currentDate.getDate() +
                      ((currentDate.getHours() < 10)?"0":"") + currentDate.getHours() + 
                      ((currentDate.getMinutes() < 10)?"0":"") + currentDate.getMinutes() +
                      ((currentDate.getSeconds() < 10)?"0":"") + currentDate.getSeconds();
    return dateTime;
};

exports.createTrackingId = function() {
    // Based off of http://stackoverflow.com/questions/9407892/how-to-generate-random-sha1-hash-to-use-as-id-in-node-js
    return crypto.createHash('sha1').update(crypto.randomBytes(20)).digest('hex');
};

// From http://stackoverflow.com/questions/46155/validate-email-address-in-javascript
// TODO make RFC 2822 compliant.
exports.validateEmail = function(email, callback) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    callback(re.test(email));
};