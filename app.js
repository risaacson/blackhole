// Might as well include the filesystem here.
var fs = require('fs');

var crypto = require('crypto');

// Use nconf to get our config.
var nconf = require('nconf');

nconf.use('file', { file: './config.json' });
nconf.load();

// TODO do some checking to make sure that our variables are here.

var mysql = require('mysql');

var AWS = require('aws-sdk');
// AWS.config.update({region: 'us-west-2'});
var s3 = new AWS.S3({
    accessKeyId: nconf.get('accesskey'),
    secretAccessKey: nconf.get('secretkey'),
    region: nconf.get('region')
});

/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , upload = require('./routes/upload')
  , http = require('http')
  , path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
// app.use(express.bodyParser());
app.use(express.bodyParser({ keepExtensions: true, uploadDir: "uploads" }));
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/upload', upload.upload);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
