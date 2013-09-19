function currentDateTime() {
    var currentDate = new Date();
    var dateTime = '' + currentDate.getFullYear()
                + (((currentDate.getMonth()+1) < 10)?"0":"") + (currentDate.getMonth()+1)
                + ((currentDate.getDate() < 10)?"0":"") + currentDate.getDate()
                + ((currentDate.getHours() < 10)?"0":"") + currentDate.getHours()
                + ((currentDate.getMinutes() < 10)?"0":"") + currentDate.getMinutes()
                + ((currentDate.getSeconds() < 10)?"0":"") + currentDate.getSeconds();
    return dateTime;
}

function createTrackingId() {
    // Based off of http://stackoverflow.com/questions/9407892/how-to-generate-random-sha1-hash-to-use-as-id-in-node-js
    return crypto.createHash('sha1').update(crypto.randomBytes(20)).digest('hex');
}

// From http://stackoverflow.com/questions/46155/validate-email-address-in-javascript
// TODO make RFC 2822 compliant.
function validateEmail(trackingId, email, callback) {
    console.log('' + trackingId + ' enter: validateEmail'); 
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    callback(re.test(email));
}

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
		if (err) throw err;
		console.log('' + trackingId + ' successfully deleted: ' + file);
	});

}

// Check to see if the bucket exists.
function bucketExists(trackingId, s3, bucket, callback) {
    s3.headBucket({ Bucket: bucket }, function(err, data) {
        console.log(JSON.stringify(err));
        console.log(JSON.stringify(data));
        if(data == null) { 
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
                console.log(JSON.stringify(err));
                console.log(JSON.stringify(data));
                if(err == null) {  } // Created
                if(data == null) {  } // Not Created
                callback();
            });
        }
    });
}

function moveUploadToS3(trackingId, s3, bucket, file) {
    console.log('' + trackingId + ' enter: moveUploadToS3');
    fs.readFile(file.path, function (err, data) {
        console.log('' + trackingId + ' readFile err = ' + JSON.stringify(err));
        // console.log('readFile data = ' + JSON.stringify(data));
        if (err) { throw err; }
        s3.client.putObject({
            Bucket: bucket,
            Key: file.name,
            Body: data
        }, function() {
            console.log('' + trackingId + ' Successfully uploaded file.');
            deleteFile(trackingId, file.path);
        })
    });
}

/*
 * 
 */

exports.upload = function(req, res){
    var trackingId = createTrackingId();
    console.log('' + trackingId + ' enter: app.post callback');

    // request.files will contain the uploaded file(s),                                          
    // keyed by the input name (in this case, "file")


    // show the supplied e-mail 
    console.log('e-mail', request.body.email);                                           

    // show the uploaded file name                                                               
    console.log('file name', request.files.file.name);                                           
    console.log('file path', request.files.file.path);                                           

    // TODO verify that the e-mail is a valid e-mail.
    // TODO check our database that the e-mail is known and get back the bucket name.
    // TODO if the e-mail is not valid or is not known delete the file and throw an error HTTP response. (Auth error?)
    validateEmail(trackingId, request.body.email, function(validEmail) {
        console.log('' + trackingId + ' enter: validateEmail callback');
        if(validEmail) {
            console.log('' + trackingId + ' enter: validEmail');
            emailInDatabase(trackingId, request.body.email, function(knownEmail) {
                console.log('' + trackingId + ' enter: emailInDatabase callback');
                if(knownEmail) {
                    console.log('' + trackingId + ' enter: knownEmail')
                    getBucket(trackingId, request.body.email, function(bucket) {
                        console.log('' + trackingId + ' enter: getBucket callback')
                        console.log('' + trackingId + ' raw bucket = ' + bucket);
                        response.send(202, 'Accepted');
                        // S3 Code
                        var uploadBucket = nconf.get('bucketprefix') + '--' + bucket;
                        console.log('' + trackingId + ' bucket = ' + uploadBucket);
                        createBucketIfMissing(trackingId, s3, uploadBucket, function() {
                            moveUploadToS3(trackingId, s3, uploadBucket, request.files.file);
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