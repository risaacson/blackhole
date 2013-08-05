// Might as well include the filesystem here.
var fs = require('fs');

// Use nconf to get our config.
var nconf = require('nconf');

nconf.use('file', { file: '../config.json' });
nconf.load();

console.log('accesskey = ' + nconf.get('accesskey'));
console.log('region = ' + nconf.get('region'));

var AWS = require('aws-sdk');
// AWS.config.update({region: 'us-west-2'});
var s3 = new AWS.S3({
    accessKeyId: nconf.get('accesskey'),
    secretAccessKey: nconf.get('secretkey'),
    region: nconf.get('region')
});

var express = require('express'),           
    app = express();     

// console.log('listBuckets');
// s3.listBuckets(function(err, data){
//     if(err == null) { console.log('err is null'); } else { console.log(JSON.stringify(err)); }
//     if(data == null) { console.log('data is null'); } else { console.log(JSON.stringify(data)); }
//     console.log('size = ' + data.Buckets.size);
//     for (var index in data.Buckets) {
//         var bucket = data.Buckets[index];
//         console.log("Bucket: ", bucket.Name, ' : ', bucket.CreationDate);
//     }
// });

// console.log('headBucket: uploadBucket');
// s3.headBucket({ Bucket: uploadBucket }, function(err, data){
//     if(err == null) {
//             console.log('err is null');
//     } else {
//         console.log(JSON.stringify(err));
//         s3.createBucket({ Bucket: uploadBucket }, function(err2, data2) {
//             if(err2 == null) { console.log('err2 is null'); } else { console.log(JSON.stringify(err2)); }
//             if(data2 == null) { console.log('data2 is null'); } else { console.log(JSON.stringify(data2)); }
//         });
//     }
//     if(data == null) {
//         console.log('data is null');
//     } else {
//         console.log(JSON.stringify(data));
//         s3.deleteBucket({ Bucket: uploadBucket}, function(err3, data3) {
//             if(err3 == null) { console.log('err3 is null'); } else { console.log(JSON.stringify(err3)); }
//             if(data3 == null) { console.log('data3 is null'); } else { console.log(JSON.stringify(data3)); }
//         });
//     }
// });


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

function isBucketEmpty(s3, name, callback) {
    s3.listObjects({ Bucket: name}, function(err, data) {
        if(data == null) { 
            console.log('Bucket ' + name + ' is empty');
            callback(false);
        } else {
            console.log('Bucket ' + name + ' is not empty');
            callback(true);
        }
    });
}
// console.log("end");

var bucket =  currentDateTime();

var uploadBucket = nconf.get('bucketprefix') + bucket;

console.log('bucket = ' + uploadBucket);

createBucketIfMissing(s3, uploadBucket, function(aBool) {
    if(aBool) { console.log ('score'); }
    else { console.log('fail'); }
});

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
