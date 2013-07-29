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

var express = require("express"),                                                                
    app = express();                                                                             

// tell express to use the bodyParser middleware                                                 
// and set upload directory                                                                      
app.use(express.bodyParser({ keepExtensions: true, uploadDir: "uploads" }));                     
app.engine('jade', require('jade').__express);                                                   

app.post("/upload", function (request, response) {                                               
    // request.files will contain the uploaded file(s),                                          
    // keyed by the input name (in this case, "file")


    // show the supplied e-mail 
    console.log("e-mail", request.body.email);                                           

    // show the uploaded file name                                                               
    console.log("file name", request.files.file.name);                                           
    console.log("file path", request.files.file.path);                                           

    // TODO verify that the e-mail is a valid e-mail.
    // TODO check our database that the e-mail is known and get back the bucket name.
    // TODO if the e-mail is not valid or is not known delete the file and throw an error HTTP response. (Auth error?)

    response.end("upload complete");                                                             
});                                                                                              

// render file upload form                                                                       
app.get("/", function (request, response) {                                                      
    response.render("upload_form.jade");                                                         
});                                                                                              

app.listen(8081);
