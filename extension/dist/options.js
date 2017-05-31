// Saves options to chrome.storage
function save_options() {
  var github_user = document.getElementById('github_user').value;
  var github_password = document.getElementById('github_password').value;
  var templates = document.getElementById('templates').value;
  var domain = document.getElementById('domain').value;

  chrome.storage.sync.set({
    github_user: github_user,
    github_password: github_password,
    templates: templates,
    domain: domain,
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
  sleep(1500);
  window.close();
}

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

// stored in chrome.storage.
function restore_options() {
  chrome.storage.sync.get({
    github_user: '',
    github_password: '',
    templates: '.github/ISSUE_TEMPLATE.md',
    domain: 'github.com',
  }, function(items) {
    document.getElementById('github_user').value = items.github_user;
    document.getElementById('github_password').value = items.github_password;
    document.getElementById('templates').value = items.templates;
    document.getElementById('domain').value = items.domain;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);
