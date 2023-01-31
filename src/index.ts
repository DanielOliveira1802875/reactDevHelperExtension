/// <reference types="chrome"/>

const script = document.createElement('script');
script.src = chrome.runtime.getURL('script.js');
(document.head || document.documentElement).appendChild(script);

export {};