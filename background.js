// extension/background.js
// This is mainly needed for the manifest.json requirement
// Most of our functionality is in popup.js and content.js
chrome.runtime.onInstalled.addListener(() => {
    console.log('Tab Sync extension installed');
  });