/* globals chrome */

// https://developer.chrome.com/extensions/declarativeContent#type-PageStateMatcher
chrome.runtime.onInstalled.addListener(updateContentInjector)
chrome.storage.onChanged.addListener(updateContentInjector)

function updateContentInjector () {
  getDomains(function (err, domains) {
    if (err) throw err
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
      chrome.declarativeContent.onPageChanged.addRules(domains.map(toRule))
    })
  })
}

function toRule (domain) {
  return {
    conditions: [
      new chrome.declarativeContent.PageStateMatcher({
        pageUrl: { hostEquals: domain.name, schemes: ['https'] },
        css: ['a.btn[href$="/issues/new"]']
      })
    ],
    actions: [
      new chrome.declarativeContent.RequestContentScript({
        js: ['content.js']
      })
    ]
  }
}

function filterDomains (items) {
  return (key) => /^domain:/.test(key) ? items[key] : undefined
}

function getDomains (cb) {
  chrome.storage.sync.get(null, function (items) {
    const domains = Object.keys(items).map(filterDomains(items)).filter(Boolean)
    if (!domains.find(({name}) => name === 'github.com')) domains.push({name: 'github.com'})
    cb(null, domains)
  })
}
