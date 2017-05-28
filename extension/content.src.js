/* globals XMLHttpRequest, chrome, btoa */
'use strict'
const githubIssueUrl = require('github-issue-url')
const gitHubInjection = require('github-injection')
const frontmatter = require('front-matter')

const isRepo = () => /^\/[^/]+\/[^/]+/.test(window.location.pathname)
const getRepoPath = () => window.location.pathname.replace(/^\/[^/]+\/[^/]+/, '')
const isIssueList = () => isRepo() && /^\/issues\/?$/.test(getRepoPath())
const getOwnerAndRepo = () => window.location.pathname.split('/').slice(1, 3)
const getRepo = () => getOwnerAndRepo().join('/')

const getDomainConfig = (name, cb) => {
  const keyName = `domain:${name}`
  chrome.storage.sync.get(keyName, function (items) {
    const domain = items[keyName]
    if (domain) {
      if (!domain.templates) domain.templates = '.github/ISSUE_TEMPLATES.md'
      cb(null, domain)
    } else {
      cb(null, {
        name: 'github.com',
        templates: '.github/ISSUE_TEMPLATES.md'
      })
    }
  })
}

document.addEventListener('DOMContentLoaded', () => {
  getDomainConfig(window.location.hostname, function (err, domain) {
    if (err) throw err
    gitHubInjection(window, function () {
      if (domain && isIssueList() && !document.querySelector('.issues-listing .github-issue-templates-content')) {
        getTemplateDefinition({repo: getRepo(), domain}, function (err, templates) {
          if (err) return console.error(err)
          if (!templates.length) return

          const currentButton = document.querySelector('.issues-listing .subnav .btn-primary')
          const buttonText = currentButton.textContent.trim()
          const dropdownString = renderList(buttonText, templates)

          const tempEl = document.createElement('div')
          tempEl.innerHTML = dropdownString
          const dropdown = tempEl.children[0]
          document.querySelector('.issues-listing .subnav .btn-primary').replaceWith(dropdown)
        })
      }
    })
  })
})

function renderList (buttonText, templates) {
  return `
   <div class="float-right select-menu js-menu-container js-select-menu">
      <button class="btn btn-primary select-menu-button js-menu-target" type="button">
        ${buttonText}
      </button>
      <div class="github-issue-templates-content select-menu-modal-holder js-menu-content js-navigation-container">
        <div class="select-menu-modal">
          <div class="select-menu-list">
              ${issueTemplatesList(templates)}
          </div>
        </div>
      </div>
    </div>
  `
}

function issueTemplatesList (templates) {
  return templates.map(function (template) {
    const queryString = githubIssueUrl(template)
    return `
      <a href="issues/new?${queryString}" class="select-menu-item js-navigation-item">
        <div class="select-menu-item-text">
          ${template.name}
        </div>
      </a>
     `
  }).join('\n')
}

const templateCache = {}
function getTemplateDefinition ({repo, domain}, cb) {
  if (templateCache[repo]) return cb(null, templateCache[repo])

  function respond (templates) {
    templateCache[repo] = templates
    cb(null, templates)
  }

  const rawUrl = `https://raw.${(domain.name === 'github.com') ? 'githubusercontent.com' : domain.name}`
  const xhr = new XMLHttpRequest()
  xhr.open('GET', `${rawUrl}/${repo}/master/${domain.templates}`, true)

  if (domain.password) {
    const basicAuth = btoa(`${domain.username || ''}:${domain.password}`)
    xhr.setRequestHeader('Authorization', `Basic ${basicAuth}`)
  }

  xhr.onreadystatechange = function () {
    if (xhr.readyState !== XMLHttpRequest.DONE) return
    if (xhr.status === 404) return respond([])
    if (xhr.status === 200) return respond(extractTemplates(xhr.responseText))
    console.log(xhr.readyState, xhr.status, xhr.responseText)
  }
  xhr.send()
}

function extractTemplates (string) {
  const templates = hugeTemplateToTemplatesArray(string)
  return templates.map(function (template) {
    const {attributes, body} = frontmatter(template)
    return {
      name: attributes.name,
      title: attributes.title,
      labels: attributes.labels,
      assignee: attributes.assignee,
      repo: attributes.repo,
      host: attributes.host,
      body: body
    }
  })
}

function hugeTemplateToTemplatesArray (string) {
  const strings = string.trim().split('\n')
  const templates = strings.reduce(function (templates, line) {
    const template = templates[templates.length - 1]
    if (line.trim() !== '---') template.push(line)
    else if (template.indexOf('---', 1) !== -1) templates.push(['---'])
    else template.push('---')
    return templates
  }, [[]]).map((t) => t.join('\n'))
  return templates
}
