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
    region: nconf.get('region');
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

function bucketExists(s3, name, callback) {
    s3.headBucket({ Bucket: name }, function(err, data) {
        console.log(JSON.stringify(err));
        console.log(JSON.stringify(data));
        if(data == null) { 
            console.log('Bucket ' + name + ' does not exist');
            callback(false);
        } else {
            console.log('Bucket ' + name + ' exists');
            callback(true);
        }
    });
}

function createBucketIfMissing(s3, name, callback) {
    bucketExists(s3, name, function(aBool) {
        if(aBool) {
            console.log('bucketExists callback: true');

            callback(true);
        } else {
            console.log('bucketExists callback: false');
            s3.createBucket({ 'Bucket': name }, function(err, data) {
                console.log(JSON.stringify(err));
                console.log(JSON.stringify(data));
                if(err == null) { callback(true); }
                if(data == null) { callback(false); }
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
                        console.log('bucket = ' + bucket);
                        response.send(202, 'Accepted');
                        // S3 Code
                        var uploadBucket = nconf.get('bucketprefix') + bucket;
                        s3.client.headBucket({bucket: uploadBucket}, function(err, data){
                            if(data == null) {
                                s3.client.createBucket({
                                    ACL: 'authenticated-read',
                                    bucket: 'uploadBucket'
                                }, function(err, data){
                                    if(err) { throw err; }
                                });
                            }
                            fs.readFile(request.files.file.path, function (err, data) {
                                if (err) { throw err; }
                                s3.client.putObject({
                                    Bucket: uploadBucket,
                                    Key: request.files.file.name,
                                    Body: data
                                }, function (res) {
                                    console.log('Successfully uploaded file.');
                                    deleteFile(request.files.file.path);
                                })
                            });
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