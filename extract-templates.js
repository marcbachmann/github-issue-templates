const frontmatter = require('front-matter')
const githubIssueUrl = require('github-issue-url')

module.exports = extractTemplates

function extractTemplates (string, defaults = {}) {
  const templates = hugeTemplateToTemplatesArray(string)
  return templates.map(function (parsedTemplate) {
    const {attributes, body} = frontmatter(parsedTemplate)
    const template = {
      name: attributes.name,
      title: attributes.title,
      labels: attributes.labels,
      assignee: attributes.assignee,
      repo: attributes.repo || defaults.repo,
      host: attributes.host || defaults.host,
      body: body
    }

    template.url = githubIssueUrl(template)
    return template
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
