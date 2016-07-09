module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    browserify: {
      Dialog: {
        src: 'src/vex2.dialog.js',
        dest: 'dist/vex2.dialog.js',
        options: {
          browserifyOptions: {
            'standalone': 'Dialog'
          }
        }
      }
    },

    uglify: {
      Dialog: {
        src: 'dist/vex2.dialog.js',
        dest: 'dist/vex2.dialog.min.js',
        options: {
          banner: '/*! vex2.dialog.min.js <%= pkg.version %> */\n',
          report: 'gzip'
        }
      }
    }
  })

  grunt.loadNpmTasks('grunt-browserify')
  grunt.loadNpmTasks('grunt-contrib-uglify')

  grunt.registerTask('default', ['browserify', 'uglify'])
}
