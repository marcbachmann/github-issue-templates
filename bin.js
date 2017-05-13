#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const yargs = require('yargs')

const argv = yargs
  .help()
  .wrap(Math.min(110, yargs.terminalWidth()))
  .usage('Usage: $0')
  .example('$0 --directory ./templates --template ./templates/README.md --destination ./README.md')
  .example('$0 --dest ./README.md --dir ./templates')
  .option('directory', {
    required: true,
    alias: 'dir',
    describe: 'templates directory',
    default: './templates',
    coerce: function (templatesDir) {
      const supportedExtensions = Object.keys(require.extensions).join('|').replace(/\./g, '\\.')
      const supporedExtensionsRegExp = new RegExp(`(${supportedExtensions})$`)
      const files = fs.readdirSync(templatesDir)
      return files.reduce(function (context, file) {
        // Don't process files starting with '.'
        if (/^\./.test(file)) return context

        const filePath = path.resolve(templatesDir, file)

        // Load all requireable files starting with '_' as context variable you can use in a template
        if (/^\_/.test(file) && supporedExtensionsRegExp.test(file)) {
          const name = path.basename(file.replace('_', ''), path.extname(file))
          context[name] = require(filePath)
        }

        // Load all requireable files
        else if (supporedExtensionsRegExp.test(file)) {
          context.templates.push(require(filePath))
        }

        return context
      }, {templates: []})
    }
  })
  .option('template', {
    required: true,
    alias: 't',
    type: 'string',
    describe: 'template file to render',
    default: './templates/README.md',
    coerce: function (val) {
      return fs.readFileSync(val, 'utf8')
    }
  })
  .option('destination', {
    required: true,
    alias: 'dest',
    type: 'string',
    describe: 'destination file',
    default: './README.md',
    normalize: true
  })
  .argv

const redent = require('redent')
const nunjucks = new (require('nunjucks').Environment)()
nunjucks.addFilter('issueUrl', function (obj) {
  let url = ''
  if (typeof obj.title === 'string') {
    url += `title=${encodeURIComponent(obj.title.trim())}&`
  }

  if (typeof obj.body === 'string') {
    url += `body=${encodeURIComponent(redent(obj.body).trim())}&`
  }

  if (obj.labels) {
    const labels = Array.isArray(obj.labels) ? obj.labels : [obj.labels]
    url += labels.map((l) => `labels[]=${encodeURIComponent(l)}`).join('&') + '&'
  }
  if (typeof obj.assignee === 'string') {
    url += `assignee=${obj.assignee}`
  }
  return url
})

const markdown = nunjucks.renderString(argv.template, argv.directory)
fs.writeFileSync(argv.destination, markdown)
