



// ===== STATE =====
let allIssues = [];
let currentTab = 'all';
let isSearchMode = false;

const API = 'https://phi-lab-server.vercel.app/api/v1/lab';

// ===== AUTH =====
function handleLogin() {
  const user = document.getElementById('username').value.trim();
  const pass = document.getElementById('password').value.trim();
  const err  = document.getElementById('login-error');

  if (user === 'admin' && pass === 'admin123') {
    err.style.display = 'none';
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('main-page').style.display = 'block';
    loadAllIssues();
  } else {
    err.style.display = 'block';
  }
}

// Enter key on login inputs
document.addEventListener('keydown', (e) => {
  const loginVisible = document.getElementById('login-page').style.display !== 'none';
  if (e.key === 'Enter' && loginVisible) {
    handleLogin();
  }
});

// Enter key on search input
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && document.activeElement === document.getElementById('search-input')) {
    performSearch();
  }
});

// ===== API CALLS =====
async function loadAllIssues() {
  showSpinner();
  try {
    const res = await fetch(`${API}/issues`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    allIssues = Array.isArray(data) ? data : (data.issues || data.data || []);
    updateCounts();
    renderIssues(filterIssues(currentTab));
  } catch (err) {
    showError('Failed to load issues. Please try again.');
  }
}

async function performSearch() {
  const q = document.getElementById('search-input').value.trim();

  if (!q) {
    isSearchMode = false;
    document.getElementById('search-label').textContent = '';
    renderIssues(filterIssues(currentTab));
    return;
  }

  showSpinner();
  isSearchMode = true;
  document.getElementById('search-label').textContent = `Search: "${q}"`;

  try {
    const res = await fetch(`${API}/issues/search?q=${encodeURIComponent(q)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const results = Array.isArray(data) ? data : (data.issues || data.data || []);
    renderIssues(results);
  } catch (err) {
    showError('Search failed. Please try again.');
  }
}

async function openIssue(id) {
  try {
    const res = await fetch(`${API}/issue/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const issue = data.issue || data.data || data;
    showModal(issue);
  } catch (err) {
    // Fallback to locally cached data if API call fails
    const issue = allIssues.find((i) => i.id === id || i._id === id);
    if (issue) showModal(issue);
  }
}

// ===== TABS =====
function switchTab(tab) {
  currentTab = tab;
  isSearchMode = false;
  document.getElementById('search-input').value = '';
  document.getElementById('search-label').textContent = '';

  ['all', 'open', 'closed'].forEach((t) => {
    document.getElementById(`tab-${t}`).classList.toggle('active', t === tab);
  });

  renderIssues(filterIssues(tab));
}

function filterIssues(tab) {
  if (tab === 'all') return allIssues;
  return allIssues.filter((i) => (i.status || '').toLowerCase() === tab);
}

function updateCounts() {
  const openCount   = allIssues.filter((i) => (i.status || '').toLowerCase() === 'open').length;
  const closedCount = allIssues.filter((i) => (i.status || '').toLowerCase() === 'closed').length;

  document.getElementById('count-all').textContent    = allIssues.length;
  document.getElementById('count-open').textContent   = openCount;
  document.getElementById('count-closed').textContent = closedCount;
  document.getElementById('summary-open-count').textContent   = openCount;
  document.getElementById('summary-closed-count').textContent = closedCount;
  document.getElementById('summary-total-count').textContent = allIssues.length;
}

// ===== RENDER ISSUES =====
function renderIssues(issues) {
  const container = document.getElementById('issues-container');

  if (!issues || issues.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg width="40" height="40" viewBox="0 0 16 16" fill="#57606a">
          <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/>
          <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"/>
        </svg>
        <h3>No issues found</h3>
        <p style="font-size:13px;">Try a different filter or search term.</p>
      </div>`;
    return;
  }

  const html = issues.map((issue) => buildCard(issue)).join('');
  container.innerHTML = `<div class="issues-grid">${html}</div>`;
}

function buildCard(issue) {
  const status   = (issue.status || '').toLowerCase();
  const isOpen   = status === 'open';
  const id       = issue.id || issue._id || '';
  const title    = esc(issue.title || 'Untitled Issue');
  const desc     = esc(issue.description || issue.body || '');
  const category = esc(issue.category || '');
  const author   = esc(issue.author || issue.user || '');
  const priority = (issue.priority || '').toLowerCase();
  const label    = esc(issue.label || (issue.labels && issue.labels[0]) || '');
  const date     = formatDate(issue.createdAt || issue.created_at);

  const priorityClass =
    priority === 'high' ? 'tag-priority-high' :
    priority === 'medium' || priority === 'med' ? 'tag-priority-med' :
    'tag-priority-low';

  const openIcon = `<img src="../images/Status-open.svg" syle = "width: 12px; height: 12px"/> `;

    const closedIcon = `<img src="../images/Status-close.svg" syle = "width: 12px; height: 12px" />`;
    
  // const closedIcon = `
  //   <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
  //     <path d="M11.28 6.78a.75.75 0 0 0-1.06-1.06L7.25 8.69 5.78 7.22a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l3.5-3.5Z"/>
  //     <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0Zm-1.5 0a6.5 6.5 0 1 0-13 0 6.5 6.5 0 0 0 13 0Z"/>
  //   </svg>`;

  // i removed this from  {${isOpen ? openIcon : closedIcon}}  there below
  // ${isOpen ? 'Open' : 'Closed'}
  return `
    <div class="issue-card ${isOpen ? 'open' : 'closed'}" onclick="openIssue('${id}')">
      <div class="card-status ${isOpen ? 'open' : 'closed'}">
        ${isOpen ? openIcon : closedIcon}
      </div>
      <div class="card-title">${title}</div>
      ${desc ? `<div class="card-desc">${desc}</div>` : ''}
      <div class="card-meta">
        ${category ? `<span class="tag tag-category">${category}</span>` : ''}
        ${priority ? `<span class="tag ${priorityClass}">${capitalize(priority)}</span>` : ''}
        ${label    ? `<span class="tag tag-label">${label}</span>` : ''}
      </div>
      <div class="card-footer">
        <span>${author ? `By ${author}` : ''}</span>
        <span>${date}</span>
      </div>
    </div>`;
}

// ===== MODAL =====
function showModal(issue) {
  const status = (issue.status || '').toLowerCase();
  const isOpen = status === 'open';

  document.getElementById('modal-title').textContent = issue.title || 'Issue Details';

  const body = document.getElementById('modal-body');
  body.innerHTML = `
    <div style="margin-bottom:14px;">
      <span class="card-status ${isOpen ? 'open' : 'closed'}" style="font-size:12px;">
        ${isOpen ? '● Open' : '✓ Closed'}
      </span>
    </div>

    ${issue.description || issue.body ? `
    <div class="modal-section">
      <label>Description</label>
      <p>${esc(issue.description || issue.body)}</p>
    </div>` : ''}

    <div class="modal-divider"></div>

    <div class="modal-grid">
      ${issue.category
        ? `<div class="modal-section"><label>Category</label>
           <p><span class="tag tag-category">${esc(issue.category)}</span></p></div>` : ''}
      ${issue.priority
        ? `<div class="modal-section"><label>Priority</label>
           <p>${esc(capitalize(issue.priority))}</p></div>` : ''}
      ${issue.author || issue.user
        ? `<div class="modal-section"><label>Author</label>
           <p>${esc(issue.author || issue.user)}</p></div>` : ''}
      ${issue.label || (issue.labels && issue.labels[0])
        ? `<div class="modal-section"><label>Label</label>
           <p><span class="tag tag-label">${esc(issue.label || issue.labels[0])}</span></p></div>` : ''}
      ${issue.createdAt || issue.created_at
        ? `<div class="modal-section"><label>Created</label>
           <p>${formatDate(issue.createdAt || issue.created_at, true)}</p></div>` : ''}
      ${issue.id || issue._id
        ? `<div class="modal-section"><label>Issue #</label>
           <p>#${issue.id || issue._id}</p></div>` : ''}
    </div>
  `;

  document.getElementById('modal-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(e) {
  if (e.target === document.getElementById('modal-overlay')) {
    closeModalDirect();
  }
}

function closeModalDirect() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModalDirect();
});

// ===== UTILITY HELPERS =====
function showSpinner() {
  document.getElementById('issues-container').innerHTML = `
    <div class="spinner-wrap">
      <div class="spinner"></div>
      <span>Loading issues…</span>
    </div>`;
}

function showError(msg) {
  document.getElementById('issues-container').innerHTML = `
    <div class="empty-state">
      <h3 style="color:#cf222e;">${msg}</h3>
    </div>`;
}

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function formatDate(dateStr, full = false) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (full) return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}
