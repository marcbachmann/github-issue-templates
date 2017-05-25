/* globals XMLHttpRequest */
'use strict'
const githubIssueUrl = require('github-issue-url')
const gitHubInjection = require('github-injection')
const frontmatter = require('front-matter')

const isRepo = () => /^\/[^/]+\/[^/]+/.test(window.location.pathname)
const getRepoPath = () => window.location.pathname.replace(/^\/[^/]+\/[^/]+/, '')
const isIssueList = () => isRepo() && /^\/issues\/?$/.test(getRepoPath())
const getOwnerAndRepo = () => window.location.pathname.split('/').slice(1, 3)
const getRepo = () => getOwnerAndRepo().join('/')

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get({
    github_user: '',
    github_password: '',
    templates: '.github/ISSUE_TEMPLATES.md',
    domain: 'github.com',
  }, function(items) {

    var github_user = items.github_user;
    var github_password = items.github_password;
    var templates = items.templates;
    var domain = items.domain;

    gitHubInjection(window, function () {
      if ( domain == window.location.hostname && isIssueList() && !document.querySelector('.issues-listing .github-issue-templates-content')) {
        getTemplateDefinition({repo: getRepo(), github_password: github_password, github_user: github_user, templates: templates}, function (err, templates) {
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
function getTemplateDefinition ({repo,github_password,github_user,templates}, cb) {
  if (templateCache[repo]) return cb(null, templateCache[repo])
  function respond (templates) {
    templateCache[repo] = templates
    cb(null, templates)
  }


    var raw_url = `https://raw.githubusercontent.com`
    if (window.location.hostname != "github.com") {
      raw_url = `https://raw.${window.location.hostname}`
    }

    var xhr = new XMLHttpRequest()
    xhr.open('GET', `${raw_url}/${repo}/master/${templates}`, true)

    if ( github_password != "" ) {
      xhr.setRequestHeader("Authorization", "Basic " + btoa(github_user + ":" + github_password))
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
