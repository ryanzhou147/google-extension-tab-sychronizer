// extension/popup.js

// This script is the main functionality of the extension
// It handles syncing tabs, opening synced tabs, and viewing tab history
// It also handles saving and loading the server URL from storage
// The getPositionData and setPositionData functions are injected into tabs to get and set position data
// The getPositionData function is used to get scroll position and video timestamp
document.addEventListener('DOMContentLoaded', function() {
    const syncButton = document.getElementById('syncTabs');
    const openButton = document.getElementById('openTabs');
    const viewButton = document.getElementById('viewTabs');
    const statusDiv = document.getElementById('status');
    const serverUrlInput = document.getElementById('serverUrl');
    const saveSettingsButton = document.getElementById('saveSettings');
    
    // Load saved server URL
    chrome.storage.sync.get(['serverUrl'], function(result) {
      if (result.serverUrl) {
        serverUrlInput.value = result.serverUrl;
      }
    });
    
    // Save server URL
    saveSettingsButton.addEventListener('click', function() {
      const serverUrl = serverUrlInput.value.trim();
      if (serverUrl) {
        chrome.storage.sync.set({serverUrl: serverUrl}, function() {
          showStatus('Settings saved', 'success');
        });
      } else {
        showStatus('Please enter a valid server URL', 'error');
      }
    });
    
    // Sync tabs
    syncButton.addEventListener('click', function() {
      chrome.storage.sync.get(['serverUrl'], function(result) {
        if (!result.serverUrl) {
          showStatus('Please set server URL first', 'error');
          return;
        }
        
        syncTabs(result.serverUrl);
      });
    });
    
    // Open synced tabs
    openButton.addEventListener('click', function() {
      chrome.storage.sync.get(['serverUrl'], function(result) {
        if (!result.serverUrl) {
          showStatus('Please set server URL first', 'error');
          return;
        }
        
        openSyncedTabs(result.serverUrl);
      });
    });
    
    // View tab history
    viewButton.addEventListener('click', function() {
      chrome.storage.sync.get(['serverUrl'], function(result) {
        if (!result.serverUrl) {
          showStatus('Please set server URL first', 'error');
          return;
        }
        
        chrome.tabs.create({url: `${result.serverUrl}/api/tabs/history`});
      });
    });
    
    function showStatus(message, type) {
      statusDiv.textContent = message;
      statusDiv.className = type;
      setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.className = '';
      }, 3000);
    }
    
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
          showStatus('Tabs synced successfully', 'success');
        })
        .catch(error => {
          showStatus('Error syncing tabs', 'error');
          console.error('Error:', error);
        });
      });
    }
    
    function openSyncedTabs(serverUrl) {
      fetch(`${serverUrl}/api/tabs/latest`)
        .then(response => response.json())
        .then(data => {
          if (data.status === 'success' && data.data.length > 0) {
            for (const window of data.data) {
              chrome.windows.create({}, newWindow => {
                for (const tab of window.tabs) {
                  chrome.tabs.create({
                    windowId: newWindow.id,
                    url: tab.url,
                    active: false
                  }, newTab => {
                    // Set scroll position and video timestamp via content script
                    // This will happen after the tab loads completely
                    chrome.scripting.executeScript({
                      target: {tabId: newTab.id},
                      function: setPositionData,
                      args: [{
                        scrollPosition: tab.scrollPosition,
                        videoTimestamp: tab.videoTimestamp
                      }]
                    });
                  });
                }
              });
            }
            showStatus('Tabs opened successfully', 'success');
          } else {
            showStatus('No synced tabs found', 'error');
          }
        })
        .catch(error => {
          showStatus('Error opening tabs', 'error');
          console.error('Error:', error);
        });
    }
  });
  
  // This function runs in the context of the tab to get position data
  function getPositionData() {
    let videoTimestamp = 0;
    // Check for HTML5 video elements
    const videos = document.querySelectorAll('video');
    if (videos.length > 0) {
      // Use the first video's current time
      videoTimestamp = videos[0].currentTime;
    }
    
    return {
      scrollPosition: window.scrollY,
      videoTimestamp: videoTimestamp
    };
  }
  
  // This function runs in the context of the tab to set position data
  function setPositionData(data) {
    // We need to wait for the page to load before setting scroll position
    if (document.readyState === 'complete') {
      setPositions();
    } else {
      window.addEventListener('load', setPositions);
    }
    
    function setPositions() {
      // Set scroll position
      window.scrollTo(0, data.scrollPosition);
      
      // Set video timestamp if applicable
      setTimeout(() => {
        const videos = document.querySelectorAll('video');
        if (videos.length > 0 && data.videoTimestamp > 0) {
          videos[0].currentTime = data.videoTimestamp;
        }
      }, 1000); // Wait a bit for video to initialize
    }
  }
