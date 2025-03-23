// Set up periodic sync every 60 seconds
const SYNC_INTERVAL = 60 * 1000; // 60 seconds in milliseconds

// Function to perform the sync
async function performBackgroundSync() {
  // Get server URL from storage
  const result = await chrome.storage.sync.get(['serverUrl']);
  if (!result.serverUrl) {
    console.log('Server URL not configured, skipping auto-sync');
    return;
  }
  
  // Call the same sync function used by the popup
  await syncTabs(result.serverUrl);
}

// Set up the interval
setInterval(performBackgroundSync, SYNC_INTERVAL);

// You'll need to move your syncTabs function from popup.js to background.js
// or create a shared module that both can import
function syncTabs(serverUrl) {
  chrome.windows.getAll({populate: true}, async function(windows) {
    const windowsData = [];
    
    for (const window of windows) {
      const windowData = {
        window_id: window.id,
        tabs: []
      };
      
      for (const tab of window.tabs) {
        // Skip chrome:// URLs as they can't be accessed by content scripts
        if (tab.url.startsWith('chrome://')) {
          windowData.tabs.push({
            url: tab.url,
            title: tab.title,
            scrollPosition: 0,
            videoTimestamp: 0
          });
          continue;
        }
        
        try {
          // Get scroll position and video timestamp from content script
          const [result] = await chrome.scripting.executeScript({
            target: {tabId: tab.id},
            function: getPositionData,
          });
          
          windowData.tabs.push({
            url: tab.url,
            title: tab.title,
            scrollPosition: result.result.scrollPosition,
            videoTimestamp: result.result.videoTimestamp
          });
        } catch (error) {
          // If we can't execute script on this tab, just save the URL and title
          windowData.tabs.push({
            url: tab.url,
            title: tab.title,
            scrollPosition: 0,
            videoTimestamp: 0
          });
        }
      }
      
      windowsData.push(windowData);
    }
    
    // Send data to server
    fetch(`${serverUrl}/api/tabs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(windowsData),
    })
    .then(response => response.json())
    .then(data => {
      console.log('Tabs synced successfully background');
    })
    .catch(error => {
      console.error('Error:', error);
    });
  });
}

