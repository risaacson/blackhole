blackhole
=========

HTTP upload to S3 Service

blackhole is a part of the hopper project.

The a user will go to the root directory of the webserver, get a form allowing them enter in their e-mail address, select a file, and submit the form uploading the file.

blackhole when recieving the form data will check the database and if the e-mail is known will allow the file to be uploaded and in turn it will upload the file to a S3 bucket for the organization linked to the e-mail address.

An authenticated administrator is able to add a user's e-mail and then associate it to a company. (Through scripts.)