/* globals XMLHttpRequest, chrome, btoa, URL */
'use strict'
const extractTemplates = require('../extract-templates')

const getRepo = (url) => {
  const match = /\/([a-zA-Z0-9\-_]*)\/([a-zA-Z0-9\-_]*)\/issues\/new/.exec(url)
  if (match) return `${match[1]}/${match[2]}`
}

const sanitize = (str) => str.replace(/[&<"']/g, (m) => {
  if (m === '&') return '&amp;'
  if (m === '<') return '&lt;'
  if (m === '"') return '&quot;'
  if (m === "'") return '&#039;'
})

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

function enhance (button) {
  // Don't enhance the button in case we already did it
  const buttonClasses = button.className
  if (/js-menu-target/.test(buttonClasses)) return

  const url = new URL(button.href)
  const hostname = url.hostname
  const repo = getRepo(url.href)
  const origin = url.origin
  getDomainConfig(hostname, function (err, domain) {
    if (err) throw err
    if (!domain) return

    getTemplateDefinition({repo, domain, origin}, function (err, templates) {
      if (err) return console.error(err)
      if (!templates.length) return

      const buttonText = button.textContent.trim()
      const dropdownString = renderList(repo, origin, buttonClasses, buttonText, templates)

      const tempEl = document.createElement('div')
      tempEl.innerHTML = dropdownString
      const dropdown = tempEl.children[0]
      button.replaceWith(dropdown)
    })
  })
}

function renderList (repo, origin, buttonClasses, buttonText, templates) {
  return `
   <div class="float-right select-menu js-menu-container js-select-menu">
      <button class="${buttonClasses} select-menu-button js-menu-target" type="button" style="float: none!important;">
        ${buttonText}
      </button>
      <div class="github-issue-templates-content select-menu-modal-holder js-menu-content js-navigation-container"
        style="right: 0;">
        <div class="select-menu-modal" style="width: 220px;">
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
    return `
      <a href="${template.url}" class="select-menu-item js-navigation-item">
        <div class="select-menu-item-text">
          ${sanitize(template.name || 'Unnamed Template')}
        </div>
      </a>
     `
  }).join('\n')
}

const templateCache = {}
function getTemplateDefinition ({repo, origin, domain}, cb) {
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
    if (xhr.status === 200) {
      const templates = extractTemplates(xhr.responseText, {repo, host: origin})
      return respond(templates)
    }
    console.error(xhr.readyState, xhr.status, xhr.responseText)
  }
  xhr.send()
}

const buttons = document.querySelectorAll('a.btn[href$="/issues/new"]')
buttons.forEach(enhance)
