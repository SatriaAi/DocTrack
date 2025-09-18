/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- TYPES ---
type Division = 'HR' | 'Finance' | 'Engineering' | 'Marketing';
type Status = 'Approved' | 'Pending' | 'Rejected';
type ViewMode = 'grid' | 'list';

// FIX: Renamed `Document` to `AppDocument` to avoid conflict with the global DOM `Document` type.
interface AppDocument {
  id: number;
  name: string;
  division: Division;
  status: Status;
  file: File;
}

// --- INITIAL STATE & DATA ---
const divisions: Division[] = ['HR', 'Finance', 'Engineering', 'Marketing'];
const statuses: Status[] = ['Approved', 'Pending', 'Rejected'];

let documents: AppDocument[] = [
  // Dummy data
  { id: 1, name: "Q3 Financial Report", division: "Finance", status: "Approved", file: new File(["Q3 Financials..."], "report.txt", { type: "text/plain" })},
  { id: 2, name: "New Hire Onboarding", division: "HR", status: "Pending", file: new File(["Welcome pack..."], "onboarding.txt", { type: "text/plain" })},
  { id: 3, name: "Project Phoenix Specs", division: "Engineering", status: "Approved", file: new File(["Specs..."], "specs.txt", { type: "text/plain" })},
  { id: 4, name: "Fall Marketing Campaign", division: "Marketing", status: "Rejected", file: new File(["Campaign details..."], "campaign.txt", { type: "text/plain" })},
];
let nextDocId = 5;

let currentView: ViewMode = 'grid';
let filters = {
  division: 'all',
  status: 'all',
  search: ''
};
let showUploadModal = false;

// --- DOM ELEMENTS ---
const root = document.getElementById('root')!;

// --- ICONS (as functions returning SVG strings) ---
const icons = {
  search: () => `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
  grid: () => `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`,
  list: () => `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>`,
  file: () => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>`,
  image: () => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`,
  pdf: () => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10.3 12.3a1 1 0 0 0-1.6 1.4"></path><path d="M14.3 11.7a1 1 0 0 1-1.6 1.4"></path><path d="M4 22V4a2 2 0 0 1 2-2h8l6 6v12a2 2 0 0 1-2 2z"></path><path d="M4.6 12.3a1 1 0 0 1 1.6-1.4"></path><path d="M8.6 11.7a1 1 0 0 0 1.6-1.4"></path></svg>`,
  text: () => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>`,
};

// --- RENDER FUNCTIONS ---
function render() {
  const appHTML = `
    ${renderSidebar()}
    <main class="main-content">
      ${renderHeader()}
      <div class="documents-container">
        <!-- Document list will be rendered here by updateDocumentsView -->
      </div>
    </main>
    ${showUploadModal ? renderUploadModal() : ''}
  `;
  root.innerHTML = appHTML;
  addEventListeners();
  updateDocumentsView(); // Initial render of documents
}

function renderSidebar() {
  return `
    <aside class="sidebar">
      <div>
        <h1 class="sidebar-header">JGSM</h1>
        <div class="sidebar-section">
          <h3>Filters</h3>
          <label for="division-filter">Filter by Division</label>
          <select id="division-filter">
            <option value="all">All Divisions</option>
            ${divisions.map(d => `<option value="${d}" ${filters.division === d ? 'selected' : ''}>${d}</option>`).join('')}
          </select>
        </div>
        <div class="sidebar-section">
          <label for="status-filter">Filter by Status</label>
          <select id="status-filter">
            <option value="all">All Statuses</option>
            ${statuses.map(s => `<option value="${s}" ${filters.status === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="sidebar-section external-links">
        <h3>External Links</h3>
        <a href="https://oss.go.id/en">OSS</a>
        <a href="#">HR Resources</a>
        <a href="#">IT Helpdesk</a>
      </div>
    </aside>
  `;
}

function renderHeader() {
  return `
    <header class="main-header">
      <div class="search-bar">
        ${icons.search()}
        <input type="search" id="search-input" placeholder="Search documents..." value="${filters.search}">
      </div>
      <div class="header-actions">
        <div class="view-toggle">
          <button id="grid-view-btn" class="${currentView === 'grid' ? 'active' : ''}" aria-label="Grid View">${icons.grid()}</button>
          <button id="list-view-btn" class="${currentView === 'list' ? 'active' : ''}" aria-label="List View">${icons.list()}</button>
        </div>
        <button id="upload-btn" class="btn btn-primary">Upload Document</button>
      </div>
    </header>
  `;
}

function renderDocumentsHTML(docs: AppDocument[]) {
    if (docs.length === 0) {
        return '<p class="no-documents-message">No documents match the current filters.</p>';
    }
    const containerClass = currentView === 'grid' ? 'documents-grid' : 'documents-list';
    return `
      <div class="${containerClass}">
        ${docs.map(doc => currentView === 'grid' ? renderDocumentCard(doc) : renderDocumentListItem(doc)).join('')}
      </div>
    `;
}

function getFileIcon(file: File) {
    if (file.type.startsWith('image/')) return icons.image();
    if (file.type === 'application/pdf') return icons.pdf();
    if (file.type.startsWith('text/')) return icons.text();
    return icons.file();
}

function renderDocumentCard(doc: AppDocument) {
  const statusClass = `status-${doc.status.toLowerCase()}`;
  return `
    <div class="document-card" data-doc-id="${doc.id}" role="button" tabindex="0" aria-label="Open document ${doc.name}">
      <div class="doc-icon">${getFileIcon(doc.file)}</div>
      <h4 class="doc-name">${doc.name}</h4>
      <div class="doc-meta">
        <span class="doc-division">${doc.division}</span>
        <span class="doc-status ${statusClass}">${doc.status}</span>
      </div>
    </div>
  `;
}

function renderDocumentListItem(doc: AppDocument) {
    const statusClass = `status-${doc.status.toLowerCase()}`;
    return `
      <div class="document-list-item" data-doc-id="${doc.id}" role="button" tabindex="0" aria-label="Open document ${doc.name}">
        <div class="doc-icon">${getFileIcon(doc.file)}</div>
        <div class="doc-name-div">
            <h4 class="doc-name">${doc.name}</h4>
        </div>
        <div class="doc-meta">
            <span class="doc-division">${doc.division}</span>
            <span class="doc-status ${statusClass}">${doc.status}</span>
        </div>
      </div>
    `;
}

function renderUploadModal() {
    return `
      <div class="modal-overlay visible" id="upload-modal-overlay">
        <div class="modal-content" role="dialog" aria-labelledby="upload-modal-title">
          <div class="modal-header">
            <h2 id="upload-modal-title">Upload New Document</h2>
            <button class="modal-close" id="upload-modal-close" aria-label="Close">&times;</button>
          </div>
          <form id="upload-form">
            <div class="form-group">
              <label for="doc-name">Document Name</label>
              <input type="text" id="doc-name" name="docName" required>
            </div>
            <div class="form-group">
              <label for="doc-division">Division</label>
              <select id="doc-division" name="docDivision" required>
                ${divisions.map(d => `<option value="${d}">${d}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label for="doc-status">Status</label>
              <select id="doc-status" name="docStatus" required>
                ${statuses.map(s => `<option value="${s}">${s}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label for="doc-file">File</label>
              <input type="file" id="doc-file" name="docFile" required>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" id="upload-cancel">Cancel</button>
              <button type="submit" class="btn btn-primary">Upload</button>
            </div>
          </form>
        </div>
      </div>
    `;
}

// --- EVENT HANDLERS & LOGIC ---

// Attaches listeners to dynamically created document items
function addDocumentEventListeners() {
    const container = document.querySelector('.documents-container');
    if (!container) return;

    // Use event delegation for performance and simplicity
    container.addEventListener('click', handleDocumentOpen);
    
    // Add keyboard accessibility for opening documents
    container.addEventListener('keydown', (e: KeyboardEvent) => {
        const target = e.target as HTMLElement;
        // Check if the event target is a document item
        if ((e.key === 'Enter' || e.key === ' ') && target.hasAttribute('data-doc-id')) {
            e.preventDefault(); // Prevent space from scrolling
            handleDocumentOpen(e);
        }
    });
}

// Main event listener setup
function addEventListeners() {
  // Filters
  document.getElementById('division-filter')?.addEventListener('change', handleFilterChange);
  document.getElementById('status-filter')?.addEventListener('change', handleFilterChange);
  document.getElementById('search-input')?.addEventListener('input', handleSearch);

  // View Toggle
  document.getElementById('grid-view-btn')?.addEventListener('click', () => setView('grid'));
  document.getElementById('list-view-btn')?.addEventListener('click', () => setView('list'));

  // Upload Modal
  document.getElementById('upload-btn')?.addEventListener('click', handleUploadModalOpen);
  if (showUploadModal) {
    document.getElementById('upload-modal-overlay')?.addEventListener('click', handleModalOverlayClick);
    document.getElementById('upload-modal-close')?.addEventListener('click', handleUploadModalClose);
    document.getElementById('upload-cancel')?.addEventListener('click', handleUploadModalClose);
    document.getElementById('upload-form')?.addEventListener('submit', handleFormSubmit);
    window.addEventListener('keydown', handleEscKey);
  } else {
    window.removeEventListener('keydown', handleEscKey);
  }
}

// Rerenders only the document list, fixing the search input focus bug
function updateDocumentsView() {
    const container = document.querySelector('.documents-container');
    if (!container) return;

    const filteredDocs = documents.filter(doc => {
        const searchMatch = doc.name.toLowerCase().includes(filters.search.toLowerCase());
        const divisionMatch = filters.division === 'all' || doc.division === filters.division;
        const statusMatch = filters.status === 'all' || doc.status === filters.status;
        return searchMatch && divisionMatch && statusMatch;
    });

    container.innerHTML = renderDocumentsHTML(filteredDocs);
    addDocumentEventListeners();
}

function handleFilterChange(e: Event) {
  const target = e.target as HTMLSelectElement;
  if (target.id === 'division-filter') {
    filters.division = target.value;
  } else if (target.id === 'status-filter') {
    filters.status = target.value;
  }
  updateDocumentsView();
}

function handleSearch(e: Event) {
  const target = e.target as HTMLInputElement;
  filters.search = target.value;
  updateDocumentsView();
}

function setView(view: ViewMode) {
  currentView = view;
  updateDocumentsView(); // Just update the document view, no need for full re-render
  // Update active state on buttons
  document.getElementById('grid-view-btn')?.classList.toggle('active', view === 'grid');
  document.getElementById('list-view-btn')?.classList.toggle('active', view === 'list');
}

function handleUploadModalOpen() {
    showUploadModal = true;
    render();
}

function handleUploadModalClose() {
    showUploadModal = false;
    render();
}

function handleModalOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
        handleUploadModalClose();
    }
}

function handleDocumentOpen(e: Event) {
    const docItem = (e.target as HTMLElement).closest('[data-doc-id]');
    
    if (!docItem) return;

    const docId = parseInt(docItem.getAttribute('data-doc-id')!, 10);
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;

    // Create a Blob URL and open it in a new tab
    // The browser will handle rendering for supported file types (PDF, images, text)
    // and prompt a download for others. This is more robust than an iframe.
    const url = URL.createObjectURL(doc.file);
    window.open(url, '_blank');
    
    // The browser automatically revokes the Blob URL when the new tab is closed,
    // so we don't need to manage it manually here.
}

function handleEscKey(e: KeyboardEvent) {
    if (e.key === 'Escape') {
        handleUploadModalClose();
    }
}

function handleFormSubmit(e: Event) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;

    if (!fileInput.files || fileInput.files.length === 0) {
        alert("Please select a file to upload.");
        return;
    }

    const newDoc: AppDocument = {
        id: nextDocId++,
        name: formData.get('docName') as string,
        division: formData.get('docDivision') as Division,
        status: formData.get('docStatus') as Status,
        file: fileInput.files![0]
    };
    documents.unshift(newDoc); // Add to the beginning of the list
    showUploadModal = false;
    render();
}

// --- INITIAL RENDER ---
document.addEventListener('DOMContentLoaded', render);
