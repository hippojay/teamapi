module.exports = {
  default: {
    paths: ['features/'],
    require: [
      'features/step_definitions/*.js',
      'world.js'
    ],
    format: [
      'progress',
      'html:reports/cucumber-report.html',
      'json:reports/cucumber-report.json'
    ],
    formatOptions: {
      snippetInterface: 'async-await'
    },
    parallel: 1
  }
};