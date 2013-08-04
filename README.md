blackhole
=========

A HTTP upload to S3 Service and subproject of hopper. blackhole is an upload service that provides a strict one way path for data.

The a user will go to the root directory of the webserver, get a form allowing them enter in their e-mail address, select a file, and submit the form uploading the file.

blackhole when recieving the form data will check the database and if the e-mail is known will allow the file to be uploaded and in turn it will upload the file to a S3 bucket for the organization linked to the e-mail address.

An authenticated administrator is able to add a user's e-mail and then associate it to a company. (Through scripts.)

Install and Run
---------------

`service iptables save; service iptables stop; chkconfig iptables off`
`service ip6tables save; service ip6tables stop; chkconfig ip6tables off`
`yum update -y; yum install -y git; reboot`
`yum install -y https://dl.fedoraproject.org/pub/epel/6/x86_64/epel-release-6-8.noarch.rpm`
`yum install -y nodejs npmyum nodejs-express nodejs-jade`
`git clone https://github.com/risaacson/blackhole.git`
`cd blackhole`
`yum erase -y nodejs-express nodejs-jade nodejs-buffer-crc32 nodejs-bytes nodejs-commander nodejs-connect nodejs-cookie nodejs-cookie-signature nodejs-debug nodejs-formidable nodejs-fresh nodejs-keypress nodejs-methods nodejs-pause nodejs-range-parser nodejs-send`

`npm install jade`
`npm install express`
`npm install nconf`

`node blackhole.js`

Upload from the CLI
-------------------

`curl --form email='YOUR_EMAIL' --form file=@FILE http://HOST:PORT/upload`
