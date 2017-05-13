[//]: <> (This file is generated from /templates/README.md. Please don't edit the one in the root directory)

# github-issue-templates

### Example

Create a new issue from one of those templates:<br>
{% set pipe = joiner('|') %}
{% for template in templates -%}
&nbsp;{{ pipe() }}&nbsp;[{{template.label}}](http://github.com/marcbachmann/github-issue-templates/issues/new?{{ template | issueUrl }})
{%- endfor %}

Those links/templates are generated out of the source from the /templates directory

### Usage

```bash
# Run
$ github-issue-templates

# the previous command has those defaults
$ github-issue-templates --destination ./README.md --directory ./templates --template ./templates/README.md

# the help lists all options
$ github-issue-templates --help
```

- All files starting with '.' are ignored
- All requireable files starting with '_' are loaded
  into a context variable you can use in your template
- All other requireable files are loaded into the 'templates' context variable
