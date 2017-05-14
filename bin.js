#!/usr/bin/env node
const fs = require('fs')
const yargs = require('yargs')
const nunjucks = require('nunjucks')
const extractTemplates = require('./extract-templates')

const argv = yargs
  .help()
  .wrap(Math.min(110, yargs.terminalWidth()))
  .usage('Usage: $0')
  .example('$0')
  .example('$0 -s ./README.tpl.md -d ./README.md')
  .option('templates', {
    required: true,
    alias: 't',
    type: 'string',
    describe: 'templates file',
    default: './.github/ISSUE_TEMPLATES.md',
    normalize: true,
    coerce: function (val) {
      return fs.readFileSync(val, 'utf8')
    }
  })
  .option('source', {
    required: true,
    alias: 's',
    type: 'string',
    describe: 'source file',
    default: './README.tpl.md',
    normalize: true,
    coerce: function (val) {
      return fs.readFileSync(val, 'utf8')
    }
  })
  .option('destination', {
    required: true,
    alias: 'd',
    type: 'string',
    describe: 'destination file',
    default: './README.md',
    normalize: true
  })
  .argv

const templates = extractTemplates(argv.templates)
const markdown = nunjucks.renderString(argv.source, {templates})
fs.writeFileSync(argv.destination, markdown)
