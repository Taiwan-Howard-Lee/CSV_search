document.addEventListener('DOMContentLoaded', function() {
  // State management
  const state = {
    advancedSearchVisible: false,
    settingsModalVisible: false,
    aboutModalVisible: false,
    documentViewerVisible: false,
    activeTab: 'content',
    currentResults: [],
    currentFacets: {}
  };

  // DOM Elements
  const elements = {
    // Search elements
    searchBtn: document.getElementById('search-btn'),
    simpleSearchBtn: document.getElementById('simple-search-btn'),
    deepSearchBtn: document.getElementById('deep-search-btn'),
    queryInput: document.getElementById('query'),
    advancedSearchLink: document.getElementById('advanced-search-link'),
    advancedSearchPanel: document.getElementById('advanced-search-panel'),

    // CSV Header elements
    addHeaderBtn: document.getElementById('add-header'),
    headersContainer: document.getElementById('headers-container'),

    // Advanced search options
    maxResults: document.getElementById('max-results'),
    searchDepth: document.getElementById('search-depth'),
    fileType: document.getElementById('file-type'),
    rankingAlgorithm: document.getElementById('ranking-algorithm'),
    schemaType: document.getElementById('schema-type'),
    includeSource: document.getElementById('include-source'),
    schemaDetection: document.getElementById('schema-detection'),
    enhancedParsing: document.getElementById('enhanced-parsing'),

    // Results elements
    loading: document.getElementById('loading'),
    resultsContainer: document.getElementById('results-container'),
    resultsList: document.getElementById('results-list'),
    csvResults: document.getElementById('csv-results'),
    downloadLink: document.getElementById('download-link'),

    // Facet elements
    documentTypeFacets: document.getElementById('document-type-facets'),
    schemaTypeFacets: document.getElementById('schema-type-facets'),

    // Document viewer elements
    documentViewer: document.getElementById('document-viewer'),
    documentTitle: document.getElementById('document-title'),
    contentTab: document.getElementById('content-tab'),
    metadataTab: document.getElementById('metadata-tab'),
    schemaTab: document.getElementById('schema-tab'),
    closeDocumentBtn: document.getElementById('close-document-button'),

    // Modal elements
    settingsLink: document.getElementById('settings-link'),
    settingsModal: document.getElementById('settings-modal'),
    closeSettingsBtn: document.getElementById('close-settings-button'),
    saveSettingsBtn: document.getElementById('save-settings-button'),
    resetSettingsBtn: document.getElementById('reset-settings-button'),
    aboutLink: document.getElementById('about-link'),
    aboutModal: document.getElementById('about-modal'),
    closeAboutBtn: document.getElementById('close-about-button')
  };

  // Initialize event listeners
  initEventListeners();

  // Initialize UI state
  updateUIState();

  // Event listener initialization
  function initEventListeners() {
    // Add header button
    elements.addHeaderBtn.addEventListener('click', addHeaderField);

    // Remove header button delegation
    elements.headersContainer.addEventListener('click', handleHeaderRemoval);

    // Search buttons
    elements.searchBtn.addEventListener('click', () => performSearch(false));
    elements.simpleSearchBtn.addEventListener('click', () => performCSVSearch('/api/search'));
    elements.deepSearchBtn.addEventListener('click', () => performCSVSearch('/api/deep-search'));

    // Advanced search toggle
    elements.advancedSearchLink.addEventListener('click', toggleAdvancedSearch);

    // Document viewer tabs
    document.querySelectorAll('.tab-button').forEach(button => {
      button.addEventListener('click', () => switchTab(button.getAttribute('data-tab')));
    });

    // Close document viewer
    elements.closeDocumentBtn.addEventListener('click', closeDocumentViewer);

    // Settings modal
    elements.settingsLink.addEventListener('click', openSettingsModal);
    elements.closeSettingsBtn.addEventListener('click', closeSettingsModal);
    elements.saveSettingsBtn.addEventListener('click', saveSettings);
    elements.resetSettingsBtn.addEventListener('click', resetSettings);
    document.getElementById('cleanup-button').addEventListener('click', cleanupFiles);

    // About modal
    elements.aboutLink.addEventListener('click', openAboutModal);
    elements.closeAboutBtn.addEventListener('click', closeAboutModal);
  }

  // Update UI based on state
  function updateUIState() {
    // Advanced search panel
    elements.advancedSearchPanel.style.display = state.advancedSearchVisible ? 'block' : 'none';

    // Document viewer
    elements.documentViewer.style.display = state.documentViewerVisible ? 'flex' : 'none';

    // Document tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.remove('active');
    });
    document.getElementById(`${state.activeTab}-tab`).classList.add('active');

    document.querySelectorAll('.tab-button').forEach(button => {
      button.classList.remove('active');
      if (button.getAttribute('data-tab') === state.activeTab) {
        button.classList.add('active');
      }
    });

    // Modals
    elements.settingsModal.style.display = state.settingsModalVisible ? 'block' : 'none';
    elements.aboutModal.style.display = state.aboutModalVisible ? 'block' : 'none';
  }

  // Add a new header field
  function addHeaderField() {
    const headerItem = document.createElement('div');
    headerItem.className = 'header-item';
    headerItem.innerHTML = `
      <input type="text" class="header-input" placeholder="Header name (e.g., 'startup name')">
      <input type="text" class="header-desc" placeholder="Description (e.g., 'Name of the company')">
      <button class="remove-header">✕</button>
    `;
    elements.headersContainer.appendChild(headerItem);
  }

  // Handle header removal
  function handleHeaderRemoval(e) {
    if (e.target.classList.contains('remove-header')) {
      if (document.querySelectorAll('.header-item').length > 1) {
        e.target.parentElement.remove();
      } else {
        alert('You need at least one header');
      }
    }
  }

  // Toggle advanced search panel
  function toggleAdvancedSearch(e) {
    e.preventDefault();
    state.advancedSearchVisible = !state.advancedSearchVisible;
    updateUIState();
  }

  // Switch document viewer tab
  function switchTab(tabName) {
    state.activeTab = tabName;
    updateUIState();
  }

  // Open document viewer
  function openDocumentViewer(url) {
    // Show loading state
    elements.documentViewer.style.display = 'flex';
    elements.contentTab.innerHTML = '<div class="loading-spinner"></div><p>Loading document...</p>';
    state.documentViewerVisible = true;
    state.activeTab = 'content';
    updateUIState();

    // Fetch document data
    fetch(`/api/document?url=${encodeURIComponent(url)}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load document');
        }
        return response.json();
      })
      .then(document => {
        // Update document viewer with content
        elements.documentTitle.textContent = document.title;
        elements.contentTab.innerHTML = document.content;

        // Update metadata tab
        let metadataHtml = '<table class="metadata-table">';
        for (const [key, value] of Object.entries(document.metadata)) {
          metadataHtml += `<tr><th>${key}</th><td>${value}</td></tr>`;
        }
        metadataHtml += '</table>';
        elements.metadataTab.innerHTML = metadataHtml;

        // Update schema tab
        if (document.schemaData && document.schemaData.length > 0) {
          let schemaHtml = '';
          document.schemaData.forEach(schema => {
            schemaHtml += `<div class="schema-item">
              <h3>${schema.type}</h3>
              <p>Source: ${schema.source}</p>
              <table class="schema-properties">`;

            for (const [key, value] of Object.entries(schema.properties)) {
              schemaHtml += `<tr><th>${key}</th><td>${value}</td></tr>`;
            }

            schemaHtml += `</table></div>`;
          });
          elements.schemaTab.innerHTML = schemaHtml;
        } else {
          elements.schemaTab.innerHTML = '<p>No schema data available for this document.</p>';
        }
      })
      .catch(error => {
        console.error('Error loading document:', error);
        elements.contentTab.innerHTML = '<p>Error loading document. Please try again.</p>';
      });
  }

  // Close document viewer
  function closeDocumentViewer() {
    state.documentViewerVisible = false;
    updateUIState();
  }

  // Open settings modal
  function openSettingsModal() {
    state.settingsModalVisible = true;
    updateUIState();
  }

  // Close settings modal
  function closeSettingsModal() {
    state.settingsModalVisible = false;
    updateUIState();
  }

  // Save settings
  function saveSettings() {
    // In a real implementation, this would save settings to localStorage or server
    alert('Settings saved successfully!');
    closeSettingsModal();
  }

  // Reset settings
  function resetSettings() {
    // In a real implementation, this would reset settings to defaults
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      alert('Settings reset to defaults.');
      closeSettingsModal();
    }
  }

  // Open about modal
  function openAboutModal() {
    state.aboutModalVisible = true;
    updateUIState();
  }

  // Close about modal
  function closeAboutModal() {
    state.aboutModalVisible = false;
    updateUIState();
  }

  // Clean up output files
  function cleanupFiles() {
    if (confirm('Are you sure you want to clean up output files? This will remove all intermediate files and preserve only final CSV results and Google search logs.')) {
      // Show loading indicator
      const cleanupButton = document.getElementById('cleanup-button');
      const originalText = cleanupButton.textContent;
      cleanupButton.textContent = 'Cleaning...';
      cleanupButton.disabled = true;

      // Call cleanup API
      fetch('/api/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Cleanup failed');
        }
        return response.json();
      })
      .then(data => {
        alert(`${data.message}\nAll preserved files have been moved to the 'results' directory.`);
        cleanupButton.textContent = originalText;
        cleanupButton.disabled = false;
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Cleanup failed. Please try again.');
        cleanupButton.textContent = originalText;
        cleanupButton.disabled = false;
      });
    }
  }

  // Perform search for JSON results
  function performSearch() {
    const query = elements.queryInput.value.trim();
    if (!query) {
      alert('Please enter a search query');
      return;
    }

    // Get search parameters
    const fileType = elements.fileType.value;
    const schemaType = elements.schemaType.value;
    const rankingAlgorithm = elements.rankingAlgorithm.value;
    const schemaDetection = elements.schemaDetection.checked;
    const enhancedParsing = elements.enhancedParsing.checked;

    // Show loading
    elements.loading.style.display = 'block';
    elements.resultsContainer.style.display = 'none';
    elements.csvResults.style.display = 'none';

    // Prepare request
    const requestData = {
      query,
      fileType,
      schemaType,
      rankingAlgorithm,
      schemaDetection,
      enhancedParsing
    };

    // Send request
    fetch('/api/search-results', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Search failed');
      }
      return response.json();
    })
    .then(data => {
      // Store results in state
      state.currentResults = data.results;
      state.currentFacets = data.facets;

      // Display results
      displaySearchResults(data);

      // Hide loading
      elements.loading.style.display = 'none';
      elements.resultsContainer.style.display = 'flex';
    })
    .catch(error => {
      console.error('Error:', error);
      elements.loading.style.display = 'none';
      alert('Search failed. Please try again.');
    });
  }

  // Display search results
  function displaySearchResults(data) {
    // Clear previous results
    elements.resultsList.innerHTML = '';
    elements.documentTypeFacets.innerHTML = '';
    elements.schemaTypeFacets.innerHTML = '';

    // Display facets
    data.facets.documentTypes.forEach(facet => {
      if (facet.count > 0) {
        const li = document.createElement('li');
        li.innerHTML = `
          <label>
            <input type="checkbox" class="facet-checkbox" data-type="documentType" data-value="${facet.name.toLowerCase()}">
            ${facet.name} (${facet.count})
          </label>
        `;
        elements.documentTypeFacets.appendChild(li);
      }
    });

    data.facets.schemaTypes.forEach(facet => {
      if (facet.count > 0) {
        const li = document.createElement('li');
        li.innerHTML = `
          <label>
            <input type="checkbox" class="facet-checkbox" data-type="schemaType" data-value="${facet.name}">
            ${facet.name} (${facet.count})
          </label>
        `;
        elements.schemaTypeFacets.appendChild(li);
      }
    });

    // Display results
    if (data.results.length === 0) {
      elements.resultsList.innerHTML = '<p>No results found. Please try a different search query.</p>';
      return;
    }

    data.results.forEach(result => {
      const resultItem = document.createElement('div');
      resultItem.className = 'result-item';

      // Create schema badges
      let schemaBadges = '';
      if (result.schemaTypes && result.schemaTypes.length > 0) {
        result.schemaTypes.forEach(type => {
          schemaBadges += `<span class="schema-badge">${type}</span>`;
        });
      }

      // Create metadata items
      let metadataItems = '';
      if (result.metadata) {
        for (const [key, value] of Object.entries(result.metadata)) {
          metadataItems += `<span class="result-metadata-item">${key}: ${value}</span>`;
        }
      }

      resultItem.innerHTML = `
        <h3 class="result-title"><a href="#" data-url="${result.url}">${result.title}</a></h3>
        <div class="result-url">${result.url}</div>
        <div class="result-snippet">${result.snippet}</div>
        <div class="result-schema-types">${schemaBadges}</div>
        <div class="result-metadata">${metadataItems}</div>
      `;

      elements.resultsList.appendChild(resultItem);
    });

    // Add event listeners to result titles
    document.querySelectorAll('.result-title a').forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const url = this.getAttribute('data-url');
        openDocumentViewer(url);
      });
    });

    // Add event listeners to facet checkboxes
    document.querySelectorAll('.facet-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', filterResults);
    });
  }

  // Filter results based on facet selection
  function filterResults() {
    const selectedDocumentTypes = [];
    const selectedSchemaTypes = [];

    // Get selected document types
    document.querySelectorAll('.facet-checkbox[data-type="documentType"]:checked').forEach(checkbox => {
      selectedDocumentTypes.push(checkbox.getAttribute('data-value'));
    });

    // Get selected schema types
    document.querySelectorAll('.facet-checkbox[data-type="schemaType"]:checked').forEach(checkbox => {
      selectedSchemaTypes.push(checkbox.getAttribute('data-value'));
    });

    // Filter results
    const filteredResults = state.currentResults.filter(result => {
      // If no document types selected, include all
      const documentTypeMatch = selectedDocumentTypes.length === 0 ||
                               selectedDocumentTypes.includes(result.documentType);

      // If no schema types selected, include all
      const schemaTypeMatch = selectedSchemaTypes.length === 0 ||
                             result.schemaTypes.some(type => selectedSchemaTypes.includes(type));

      return documentTypeMatch && schemaTypeMatch;
    });

    // Update results display
    elements.resultsList.innerHTML = '';

    if (filteredResults.length === 0) {
      elements.resultsList.innerHTML = '<p>No results match the selected filters. Please adjust your filter criteria.</p>';
      return;
    }

    filteredResults.forEach(result => {
      const resultItem = document.createElement('div');
      resultItem.className = 'result-item';

      // Create schema badges
      let schemaBadges = '';
      if (result.schemaTypes && result.schemaTypes.length > 0) {
        result.schemaTypes.forEach(type => {
          schemaBadges += `<span class="schema-badge">${type}</span>`;
        });
      }

      // Create metadata items
      let metadataItems = '';
      if (result.metadata) {
        for (const [key, value] of Object.entries(result.metadata)) {
          metadataItems += `<span class="result-metadata-item">${key}: ${value}</span>`;
        }
      }

      resultItem.innerHTML = `
        <h3 class="result-title"><a href="#" data-url="${result.url}">${result.title}</a></h3>
        <div class="result-url">${result.url}</div>
        <div class="result-snippet">${result.snippet}</div>
        <div class="result-schema-types">${schemaBadges}</div>
        <div class="result-metadata">${metadataItems}</div>
      `;

      elements.resultsList.appendChild(resultItem);
    });

    // Add event listeners to result titles
    document.querySelectorAll('.result-title a').forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const url = this.getAttribute('data-url');
        openDocumentViewer(url);
      });
    });
  }

  // Perform CSV search
  function performCSVSearch(endpoint) {
    const query = elements.queryInput.value.trim();
    if (!query) {
      alert('Please enter a search query');
      return;
    }

    const headerInputs = document.querySelectorAll('.header-input');
    const headerDescs = document.querySelectorAll('.header-desc');
    const headers = [];
    const headerDescriptions = {};

    for (let i = 0; i < headerInputs.length; i++) {
      const header = headerInputs[i].value.trim();
      if (header) {
        headers.push(header);
        const desc = headerDescs[i].value.trim();
        if (desc) {
          headerDescriptions[header] = desc;
        }
      }
    }

    if (headers.length === 0) {
      alert('Please add at least one header');
      return;
    }

    const maxResults = parseInt(elements.maxResults.value) || 10;
    const searchDepth = parseInt(elements.searchDepth.value) || 2;
    const includeSource = elements.includeSource.checked;
    const schemaDetection = elements.schemaDetection.checked;
    const enhancedParsing = elements.enhancedParsing.checked;

    // Show loading
    elements.loading.style.display = 'block';
    elements.resultsContainer.style.display = 'none';
    elements.csvResults.style.display = 'none';

    // Prepare request
    const requestData = {
      query,
      headers,
      headerDescriptions,
      maxResults,
      searchDepth,
      includeSource,
      schemaDetection,
      enhancedParsing
    };

    // Send request
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Search failed');
      }
      return response.blob();
    })
    .then(blob => {
      // Create download link
      const url = URL.createObjectURL(blob);
      elements.downloadLink.href = url;
      elements.downloadLink.download = `search-results-${new Date().toISOString().slice(0, 10)}.csv`;

      // Show results
      elements.loading.style.display = 'none';
      elements.csvResults.style.display = 'block';
    })
    .catch(error => {
      console.error('Error:', error);
      elements.loading.style.display = 'none';
      alert('Search failed. Please try again.');
    });
  }
});
