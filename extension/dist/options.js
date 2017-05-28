/* globals chrome */
function saveDomain (form, previousName) {
  if (typeof previousName === 'string') removeDomain(previousName)

  const username = form.querySelector('#username').value
  const password = form.querySelector('#password').value
  const templates = form.querySelector('#templates').value
  const domainName = form.querySelector('#domain').value
  const domain = {name: domainName, username, password, templates}
  chrome.storage.sync.set({
    [`domain:${domain.name}`]: domain
  })
}

function removeDomain (domainName) {
  chrome.storage.sync.remove(`domain:${domainName}`)
}

function renderDomainForm (domainName) {
  const item = `domain:${domainName}`
  chrome.storage.sync.get(item, function (items) {
    const domain = items[item] || {name: '', isNew: true}
    document.body.innerHTML = `
      <header class="bar bar-nav">
        <h1 class="title">${domain.isNew ? 'Add new domain' : `Edit: ${domain.name}`}</h1>
      </header>
        <form method="post" class="content content-padded" autocomplete="off" data-domain="${domain.name}">
          <label for="domain">Domain</label>
          <input type="text" id="domain" placeholder="e.g. github.com" value="${domain.name}" required>

          <label for="password">Token or Password</label>
          <input type="password" id="password" value="${domain.password || ''}">

          <label for="username">Username (only if password)</label>
          <input type="text" id="username" value="${domain.username || ''}">

          <label for="templates">Templates path</label>
          <input type="text" id="templates" value="${domain.templates || ''}" placeholder="default: .github/ISSUE_TEMPLATES.md">

        <div class="bar bar-standard bar-footer">
          <button type="reset" class="btn btn-link pull-left" data-action="cancel">
            <span class="icon icon-close"></span>
            Cancel
          </button>

          ${domain.isNew ? '' : `
            <button type="reset" class="btn btn-link pull-left" data-action="remove" data-domain="${domain.name}">
              Remove
              <span class="icon icon-trash"></span>
            </button>
          `}

          <button type="submit" class="btn btn-link pull-right">
            Save
            <span class="icon icon-check"></span>
          </button>
        </div>
      </form>
    `
  })
}

function renderList () {
  chrome.storage.sync.get(null, function (items) {
    const listItems = Object.keys(items)
      .map((d) => /^domain:/.test(d) && items[d])
      .filter(Boolean)
      .map(toListItem)

    const itemsList = !listItems.length ? '' : `
      <div class="card">
        <ul class="table-view">${listItems.join('\n')}</ul>
      </div>
    `

    const itemsListEmpty = listItems.length ? '' : `
      <div class="content-padded">
        There are no configured domains. Please add one.
      </div>
    `

    document.body.innerHTML = `
      <header class="bar bar-nav">
        <h1 class="title">Github Issue Templates</h1>
      </header>
      <div class="content">
        ${itemsList}
        ${itemsListEmpty}
        <div class="bar bar-standard bar-footer">
          <button class="btn btn-link pull-right" data-action="add">
            Add Domain
            <span class="icon icon-right-nav icon-plus"></span>
          </button>
        </div>
      </div>
    `
  })
}

function toListItem (domain) {
  return `
    <li class="table-view-cell">
      <a class="navigate-right" data-action="edit" data-domain="${domain.name}">
        ${domain.name}
      </a>
    </li>
  `
}

function onSubmit (evt) {
  evt.preventDefault()
  saveDomain(evt.target, evt.target.attributes['data-domain'].value)
  renderList()
}

function onAction (evt) {
  const {attributes} = evt.target
  const action = attributes['data-action'] && attributes['data-action'].value
  if (action === 'add') renderDomainForm()
  if (action === 'edit') renderDomainForm(attributes['data-domain'].value)
  if (action === 'cancel') renderList()
  if (action === 'remove') {
    removeDomain(attributes['data-domain'].value)
    renderList()
  }
}

document.addEventListener('DOMContentLoaded', renderList)
document.addEventListener('submit', onSubmit)
document.addEventListener('click', onAction)
