document.getElementById('open-settings').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: () => {
        const panel = document.getElementById('ai730-panel');
        const fab   = document.getElementById('ai730-fab');
        if (panel) {
          panel.classList.remove('ai730-hidden');
          fab && fab.classList.add('ai730-active');
          document.getElementById('ai730-settings-btn')?.click();
        }
      }
    });
    window.close();
  });
});
