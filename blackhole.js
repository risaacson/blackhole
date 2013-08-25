// Might as well include the filesystem here.
var fs = require('fs');

// Use nconf to get our config.
var nconf = require('nconf');

nconf.use('file', { file: './config.json' });
nconf.load();

// TODO do some checking to make sure that our variables are here.

var mysql      = require('mysql');

var AWS = require('aws-sdk');
// AWS.config.update({region: 'us-west-2'});
var s3 = new AWS.S3({
    accessKeyId: nconf.get('accesskey'),
    secretAccessKey: nconf.get('secretkey'),
    region: nconf.get('region')
});

var express = require('express'),                                                           
    app = express();                                                                             

// From http://stackoverflow.com/questions/46155/validate-email-address-in-javascript
// TODO make RFC 2822 compliant.
function validateEmail(email, callback) {
    console.log('enter: validateEmail'); 
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    callback(re.test(email));
}

function query(sql, connection, callback) {
    console.log('enter: query');
    connection.query(sql, function (error, results, fields) {
        console.log('enter: connection.query callback');
        if (error) {
            console.log('Error in query');
        }
        if (results.length  > 0) {
            callback(results);
        } else {
            callback('zero');
        }
        connection.end();
    });
}

function emailInDatabase(email, callback) {
    console.log('enter: emailInDatabase');
    var connection  = mysql.createConnection({
        host     : nconf.get('host'),
        port     : nconf.get('port'),
        user     : nconf.get('username'),
        password : nconf.get('password'),
        database : nconf.get('database'),
    });

    query("SELECT email FROM email_to_bucket where email = " + connection.escape(email), connection, function(results) {
        console.log('enter: emailInDatabase.query callback');
        if(results != 'zero') {
            callback(true);
        } else {
            callback(false);
        }
    });
}

function getBucket(email, callback) {
    console.log('enter: getBucket');
	var connection  = mysql.createConnection({
  		host     : nconf.get('host'),
  		port     : nconf.get('port'),
  		user     : nconf.get('username'),
  		password : nconf.get('password'),
  		database : nconf.get('database'),
	});

	query("SELECT bucket FROM email_to_bucket where email = " + connection.escape(email), connection, function(results) {
        console.log('enter: getBucket.query callback');
        if(results != 'zero') {
		  callback(results[0].bucket);
        }
	});
}

function deleteFile(file) {
    console.log('enter: deleteFile');
	// Asyncronously unlink the file.
	fs.unlink(file, function (err) {
        console.log('enter: fs.unlink callback');
		if (err) throw err;
		console.log('successfully deleted: ' + file);
	});

}

// Check to see if the bucket exists.
function bucketExists(s3, bucket, callback) {
    s3.headBucket({ Bucket: bucket }, function(err, data) {
        console.log(JSON.stringify(err));
        console.log(JSON.stringify(data));
        if(data == null) { 
            console.log('Bucket ' + bucket + ' does not exist');
            callback(false);
        } else {
            console.log('Bucket ' + bucket + ' exists');
            callback(true);
        }
    });
}

// Create the bucket if it is missing.
function createBucketIfMissing(s3, bucket, callback) {
    bucketExists(s3, bucket, function(aBool) {
        if(aBool) {
            console.log('bucketExists callback: true');
            callback(true);
        } else {
            console.log('bucketExists callback: false');
            s3.createBucket({ ACL: 'authenticated-read', 'Bucket': name }, function(err, data) {
                console.log(JSON.stringify(err));
                console.log(JSON.stringify(data));
                if(err == null) {  } // Created
                if(data == null) {  } // Not Created
                callback();
            });
        }
    });
}

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

function moveUploadToS3(s3, bucket, file) {
    console.log('enter: moveUploadToS3');
    fs.readFile(file.path, function (err, data) {
        console.log('readFile err = ' + JSON.stringify(err));
        console.log('readFile data = ' + JSON.stringify(data));
        if (err) { throw err; }
        s3.client.putObject({
            Bucket: uploadBucket,
            Key: file.name,
            Body: data
        }, function() {
            console.log('Successfully uploaded file.');
            deleteFile(file.path);
        })
    });
}

// tell express to use the bodyParser middleware                                                 
// and set upload directory                                                                      
app.use(express.bodyParser({ keepExtensions: true, uploadDir: "uploads" }));                     
app.engine('jade', require('jade').__express);                                                   

app.post("/upload", function (request, response) {
    console.log('enter: app.post callback');                                               
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
    validateEmail(request.body.email, function(validEmail) {
        console.log('enter: validateEmail callback');
        if(validEmail) {
            console.log('enter: validEmail');
            emailInDatabase(request.body.email, function(knownEmail) {
                console.log('enter: emailInDatabase callback');
                if(knownEmail) {
                    console.log('enter: knownEmail')
                    getBucket(request.body.email, function(bucket) {
                        console.log('enter: getBucket callback')
                        console.log('raw bucket = ' + bucket);
                        response.send(202, 'Accepted');
                        // S3 Code
                        var uploadBucket = nconf.get('bucketprefix') + bucket;
                        console.log('bucket = ' + uploadBucket);
                        createBucketIfMissing(s3, uploadBucket, function() {
                        // s3.client.headBucket({ Bucket: uploadBucket }, function(err, data){
                        //     console.log('enter: headBucket callback');
                        //     console.log('headBucket err = ' + JSON.stringify(err));
                        //     console.log('headbucket data = ' + JSON.stringify(data));
                        //     if(data == null) {
                        //         s3.client.createBucket({
                        //             ACL: 'authenticated-read',
                        //             bucket: uploadBucket
                        //         }, function(err, data){
                        //             console.log('enter: createBucket callback');
                        //             console.log('createBucket err = ' + JSON.stringify(err));
                        //             console.log('createBucket data = ' + JSON.stringify(data));
                        //             if(err) { throw err; }
                        //         });
                        //     }
                            moveUploadtoS3(s3, uploadBucket, request.files.file);
                        });
                    });
                } else {
                    console.log('enter: not knownEmail');
                    deleteFile(request.files.file.path);
                    response.send(500, 'Unknown e-mail.');
                }
            });
        } else {
            console.log('enter: not validEmail');
            deleteFile(request.files.file.path);
            response.send(500, 'E-mail is invaild.');
        }
    });
});                                                                                              

// render file upload form                                                                       
app.get("/", function (request, response) {                                                      
    response.render('upload_form.jade');                                                         
});                                                                                              

app.listen(8081);