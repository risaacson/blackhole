// Might as well include the filesystem here.
var fs = require('fs');

// Use nconf to get our config.
var nconf = require('nconf');

nconf.use('file', { file: '../config.json' });
nconf.load();

var AWS = require('aws-sdk');
// AWS.config.update({region: 'us-west-2'});
var s3 = new AWS.S3({
    accessKeyId: nconf.get(accesskey),
    secretAccessKey: nconf.get(secretkey),
    region: nconf.get(region);
});

                        // var uploadBucket = nconf.get('bucketprefix') + bucket;
                        // s3.client.headBucket({bucket: 'uploadBucket'}, function(err, data){
                        //     if(data == null) {
                        //         s3.client.createBucket({
                        //             ACL: 'authenticated-read',
                        //             bucket: 'uploadBucket'
                        //         }, function(err, data){
                        //             if(err) { throw err; }
                        //         });
                        //     }
                        //     fs.readFile(request.files.file.path, function (err, data) {
                        //         if (err) { throw err; }
                        //         s3.client.putObject({
                        //             Bucket: uploadBucket,
                        //             Key: request.files.file.name,
                        //             Body: data
                        //         }, function (res) {
                        //             console.log('Successfully uploaded file.');
                        //             deleteFile(request.files.file.path);
                        //         })
                        //     });
