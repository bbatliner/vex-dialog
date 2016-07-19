module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    browserify: {
      dialog: {
        src: 'src/vex.dialog.js',
        dest: 'dist/vex.dialog.js',
        options: {
          browserifyOptions: {
            'standalone': 'vexDialog'
          }
        }
      }
    },

    uglify: {
      dialog: {
        src: 'dist/vex.dialog.js',
        dest: 'dist/vex.dialog.min.js',
        options: {
          banner: '/*! vex.dialog.min.js <%= pkg.version %> */\n',
          report: 'gzip'
        }
      }
    }
  })

  grunt.loadNpmTasks('grunt-browserify')
  grunt.loadNpmTasks('grunt-contrib-uglify')

  grunt.registerTask('default', ['browserify', 'uglify'])
}
