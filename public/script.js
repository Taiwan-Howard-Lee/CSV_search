document.addEventListener('DOMContentLoaded', function() {
  // Add header button
  document.getElementById('add-header').addEventListener('click', function() {
    const container = document.getElementById('headers-container');
    const headerItem = document.createElement('div');
    headerItem.className = 'header-item';
    headerItem.innerHTML = `
      <input type="text" class="header-input" placeholder="Header name (e.g., 'startup name')">
      <input type="text" class="header-desc" placeholder="Description (e.g., 'Name of the company')">
      <button class="remove-header">✕</button>
    `;
    container.appendChild(headerItem);
  });
  
  // Remove header button
  document.getElementById('headers-container').addEventListener('click', function(e) {
    if (e.target.classList.contains('remove-header')) {
      if (document.querySelectorAll('.header-item').length > 1) {
        e.target.parentElement.remove();
      } else {
        alert('You need at least one header');
      }
    }
  });
  
  // Simple search button
  document.getElementById('search-btn').addEventListener('click', function() {
    performSearch('/api/search');
  });
  
  // Deep search button
  document.getElementById('deep-search-btn').addEventListener('click', function() {
    performSearch('/api/deep-search');
  });
  
  // Function to perform search
  function performSearch(endpoint) {
    const query = document.getElementById('query').value.trim();
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
    
    const maxResults = parseInt(document.getElementById('max-results').value) || 10;
    const searchDepth = parseInt(document.getElementById('search-depth').value) || 2;
    const includeSource = document.getElementById('include-source').checked;
    
    // Show loading
    document.getElementById('loading').style.display = 'block';
    document.getElementById('results').style.display = 'none';
    
    // Prepare request
    const requestData = {
      query,
      headers,
      headerDescriptions,
      maxResults,
      searchDepth,
      includeSource
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
      const downloadLink = document.getElementById('download-link');
      downloadLink.href = url;
      downloadLink.download = `search-results-${new Date().toISOString().slice(0, 10)}.csv`;
      
      // Show results
      document.getElementById('loading').style.display = 'none';
      document.getElementById('results').style.display = 'block';
    })
    .catch(error => {
      console.error('Error:', error);
      document.getElementById('loading').style.display = 'none';
      alert('Search failed. Please try again.');
    });
  }
});
