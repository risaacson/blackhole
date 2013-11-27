blackhole
=========

A HTTP upload to S3 Service and subproject of hopper. blackhole is an upload service that provides a strict one way path for data.

The a user will go to the root directory of the webserver, get a form allowing them enter in their e-mail address, select a file, and submit the form uploading the file.

blackhole when recieving the form data will check the database and if the e-mail is known will allow the file to be uploaded and in turn it will upload the file to a S3 bucket for the organization linked to the e-mail address.

An authenticated administrator is able to add a user's e-mail and then associate it to a company. (Through scripts.)

We are using supervisor here as there are still some bugs that will take down the instance and but not something that corrupts the system.

Install and Run
---------------

```Shell
service iptables save; service iptables stop; chkconfig iptables off
service ip6tables save; service ip6tables stop; chkconfig ip6tables off
yum update -y; reboot
yum install -y https://dl.fedoraproject.org/pub/epel/6/x86_64/epel-release-6-8.noarch.rpm
yum install -y git nodejs nodejs-supervisor npm
git clone https://github.com/risaacson/blackhole.git
cd blackhole

# Edit the config file and add your values.
${EDITOR} config.json

npm install
supervisor blackhole.js
```

Upload from the CLI
-------------------

`curl --form email='YOUR_EMAIL' --form file=@FILE http://HOST:PORT/upload`

Developing
----------

We use GruntJS to automate a few development tasks and best practices. Please see the GruntJS homepage for install instructions. Grunt is not needed to execute a production instance.

You can execute jshint against the JavaScript files by executing:
`grunt jshint`

You can executing nodeunit to execute the unit tests by executing:
`grunt nodeunit`