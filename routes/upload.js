var blackholeUtil = require('../util/blackholeUtil');

// Might as well include the filesystem here.
var fs = require('fs');

// Use nconf to get our config.
var nconf = require('nconf');

nconf.use('file', { file: './config.json' });
nconf.load();

// TODO do some checking to make sure that our values are here.

var mysql = require('mysql');

var AWS = require('aws-sdk');
if(nconf.get('logging').toLowerCase() === 'true') {
  AWS.config.update({logger: process.stdout});
}
var awsOptions = {
    accessKeyId: nconf.get('accesskey'),
    secretAccessKey: nconf.get('secretkey'),
};
if(nconf.get('proxy').toLowerCase() !== "none") {
  awsOptions.httpOptions = { proxy: nconf.get('proxy').toLowerCase() };
}
if(nconf.get('proxytype').toLowerCase() === "riakcs") {
}else {
  awsOptions.region = nconf.get('region').toLowerCase();
}
var s3 = new AWS.S3(awsOptions);

function query(trackingId, sql, connection, callback) {
    console.log('' + trackingId + ' enter: query');
    connection.query(sql, function (error, results, fields) {
        console.log('' + trackingId + ' enter: connection.query callback');
        if (error) {
            console.log('' + trackingId + ' Error in query');
        }
        if (results.length  > 0) {
            callback(results);
        } else {
            callback('zero');
        }
        connection.end();
    });
}

function emailInDatabase(trackingId, email, callback) {
    console.log('' + trackingId + ' enter: emailInDatabase');
    var connection  = mysql.createConnection({
        host     : nconf.get('host'),
        port     : nconf.get('port'),
        user     : nconf.get('username'),
        password : nconf.get('password'),
        database : nconf.get('database'),
    });

    query(trackingId, "SELECT email FROM email_to_bucket where email = " + connection.escape(email), connection, function(results) {
        console.log('' + trackingId + ' enter: emailInDatabase.query callback');
        if(results != 'zero') {
            callback(true);
        } else {
            callback(false);
        }
    });
}

function getBucket(trackingId, email, callback) {
    console.log('' + trackingId + ' enter: getBucket');
	var connection  = mysql.createConnection({
        host     : nconf.get('host'),
        port     : nconf.get('port'),
        user     : nconf.get('username'),
        password : nconf.get('password'),
        database : nconf.get('database'),
	});

	query(trackingId, "SELECT bucket FROM email_to_bucket where email = " + connection.escape(email), connection, function(results) {
        console.log('' + trackingId + ' enter: getBucket.query callback');
        if(results != 'zero') {
          callback(results[0].bucket);
        }
	});
}

function deleteFile(trackingId, file) {
    console.log('' + trackingId + ' enter: deleteFile');
	// Asyncronously unlink the file.
	fs.unlink(file, function (err) {
        console.log('' + trackingId + ' enter: fs.unlink callback');
		if (err) { console.log('' + trackingId + ' unlink error: ' + file); }
		else { console.log('' + trackingId + ' successfully deleted: ' + file); }
	});

}

// Check to see if the bucket exists.
function bucketExists(trackingId, s3, bucket, callback) {
    s3.headBucket({ Bucket: bucket }, function(err, data) {
        // console.log(JSON.stringify(err));
        // console.log(JSON.stringify(data));
        if(data === null) { 
            console.log('' + trackingId + ' Bucket ' + bucket + ' does not exist');
            callback(false);
        } else {
            console.log('' + trackingId + ' Bucket ' + bucket + ' exists');
            callback(true);
        }
    });
}

// Create the bucket if it is missing.
function createBucketIfMissing(trackingId, s3, bucket, callback) {
    bucketExists(trackingId, s3, bucket, function(aBool) {
        if(aBool) {
            console.log('' + trackingId + ' bucketExists callback: true');
            callback(true);
        } else {
            console.log('' + trackingId + ' bucketExists callback: false');
            s3.createBucket({ ACL: 'authenticated-read', 'Bucket': bucket }, function(err, data) {
                // console.log(JSON.stringify(err));
                // console.log(JSON.stringify(data));
                if(err === null) {  } // Created
                if(data === null) {  } // Not Created
                callback();
            });
        }
    });
}

function moveUploadToS3(trackingId, s3, bucket, file) {
    console.log('' + trackingId + ' enter: moveUploadToS3');
    var stream = fs.createReadStream(file.path);
        s3.client.putObject({
            Bucket: bucket,
            Key: file.name,
            Body: stream
        }, function() {
            console.log('' + trackingId + ' Successfully uploaded file.');
            deleteFile(trackingId, file.path);
        });
}

var request = require('request');
var request = request.defaults({jar: true});
var cheerio = require('cheerio');
function logToServer(trackingId, dateTime, email, bucket, fileName) {
  request.get(nconf.get('loggingurl'), function(error, response, body) {
//    console.log("response=" + response);
//    console.log("body=" + body);
    if(!error && response.statusCode == 200) {
      console.log('' + trackingId + ' pre logging query successful');
    } else {
      console.log('' + trackingId + ' pre logging query  failed');
      return;
    }
    $ = cheerio.load(body, { ignoreWhitespace: true });
    csrf = $(':input[name=_csrf]').attr('value');
//    console.log('' + trackingId + ' csrf = ' + csrf);
    var formData = { 'form': {
      'trackingId': trackingId,
      'dateTime': dateTime,
      'email': email,
      'bucket': bucket,
      'fileName': fileName,
      '_csrf': csrf
    }};
    request.post(nconf.get('loggingurl'), formData, function(error, response, body){
//      console.log("response=" + response);
//      console.log("body=" + body);
      if(!error && response.statusCode == 200) {
        console.log('' + trackingId + ' logging successful');
      } else {
        console.log('' + trackingId + ' logging failed');
      }
    });
  });
}

/*
 * 
 */
exports.upload = function(request, response){
    var trackingId = blackholeUtil.createTrackingId();
    console.log('' + trackingId + ' enter: app.post callback');

    // request.files will contain the uploaded file(s),                                          
    // keyed by the input name (in this case, "file")

    // show the supplied e-mail 
    // console.log('' + trackingId + ' e-mail: ', request.body.email);                                           

    // show the uploaded file name
    // console.log('' + trackingId + ' file name: ', request.files.file.name);                                           
    // console.log('' + trackingId + ' file path: ', request.files.file.path);                                           

    blackholeUtil.validateEmail(request.body.email, function(validEmail) {
        console.log('' + trackingId + ' enter: validateEmail callback');
        if(validEmail) {
            console.log('' + trackingId + ' enter: validEmail');
            emailInDatabase(trackingId, request.body.email, function(knownEmail) {
                console.log('' + trackingId + ' enter: emailInDatabase callback');
                if(knownEmail) {
                    console.log('' + trackingId + ' enter: knownEmail');
                    getBucket(trackingId, request.body.email, function(bucket) {
                        console.log('' + trackingId + ' enter: getBucket callback');
                        // console.log('' + trackingId + ' raw bucket = ' + bucket);
                        response.send(202, 'Accepted');
                        // S3 Code
                        var uploadBucket = nconf.get('bucketprefix') + '--' + bucket;
                        console.log('' + trackingId + ' bucket = ' + uploadBucket);
                        createBucketIfMissing(trackingId, s3, uploadBucket, function() {
                            moveUploadToS3(trackingId, s3, uploadBucket, request.files.file);
                            logToServer(trackingId, blackholeUtil.currentDateTime(), request.body.email, uploadBucket, request.files.file.name);
                        });
                    });
                } else {
                    console.log('' + trackingId + ' enter: not knownEmail');
                    deleteFile(trackingId, request.files.file.path);
                    response.send(500, 'Unknown e-mail.');
                }
            });
        } else {
            console.log('' + trackingId + ' enter: not validEmail');
            deleteFile(trackingId, request.files.file.path);
            response.send(500, 'E-mail is invaild.');
        }
    });
};