// Might as well include the filesystem here.
var fs = require('fs');

// Use nconf to get our config.
var nconf = require('nconf');

nconf.use('file', { file: './config.json' });
nconf.load();

// TODO do some checking to make sure that our variables are here.
// verify nconf.get('host')
// verify nconf.get('port')
// verify nconf.get('username')
// verify nconf.get('password')
// verify nconf.get('database')

// Create the general object for using mysql.
var mysql      = require('mysql');
var pool  = mysql.createPool({
  host     : nconf.get('host'),
  port     : nconf.get('port'),
  user     : nconf.get('username'),
  password : nconf.get('password'),
  database : nconf.get('database'),
});
pool.getConnection(function(err, connection) {
	// TODO bomb out if the database goes down.
	// TODO later figure out how to deal with waiting for a reconnect.
  // connected! (unless `err` is set)
});

var express = require('express'),                                                           
    app = express();                                                                             

// From http://stackoverflow.com/questions/46155/validate-email-address-in-javascript
// TODO make RFC 2822 compliant.
function validateEmail(email) { 
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

// TODO finish off the logic here.
// TODO if an empty response throw an exception
// throw "empty bucket";
function getBucket(email) {
	pool.getConnection(function(err, connection) {
	// Use the connection and make a query.
	connection.query( 'SELECT bucket FROM email_to_bucket where email=' + email , function(err, rows) {
		// And done with the connection.
		connection.end();
		console.log('rows' + rows);
 		// Don't use the connection here, it has been returned to the pool.
		});
	});
}

function deteleFile(file) {
	// Asyncronously unlink the file.
	fs.unlink(file, function (err) {
		if (err) throw err;
		console.log('successfully deleted' + file);
	});

}

// tell express to use the bodyParser middleware                                                 
// and set upload directory                                                                      
app.use(express.bodyParser({ keepExtensions: true, uploadDir: "uploads" }));                     
app.engine('jade', require('jade').__express);                                                   

app.post("/upload", function (request, response) {                                               
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
    if(validateEmail(request.body.email)) {
    	try {
    		bucket = getBucket(request.body.email);
    	} catch(err) {
    		deleteFile(request.files.file.path);
    		// TODO is this the right error for here?
    		response.send(500, 'Something broke!');
    	}
    	// TODO asyncronously call an upload to the s3 bucket.
    	//response.end('upload complete');
    	response.send(202, 'Accepted');
    } else {
    	deleteFile(request.files.file.path);
    	response.send(500, 'Something broke!');
    }
                                                                 
});                                                                                              

// render file upload form                                                                       
app.get("/", function (request, response) {                                                      
    response.render('upload_form.jade');                                                         
});                                                                                              

app.listen(8081);
