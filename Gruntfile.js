module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: { all: ['app.js', 'routes/*.js', 'util/*.js', 'test/*_test.js'] },
    nodeunit: { all: ['test/*_test.js']}
  });
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  //grunt.registerTask('default', ['jshint']);
};