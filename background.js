// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var tabwinId = null;
var extensionWindowName = "TabView";

openWindow();

function openWindow(state = 'minimized'){
	chrome.windows.create({
		url:chrome.extension.getURL("view.html"),
		type: "popup",
		state: state }, function(window){
			tabwinId = window.id;
	});	
}

//on extension icon clicked
chrome.browserAction.onClicked.addListener(function(tab) {
	chrome.windows.getCurrent(function (win) {
            chrome.tabs.query({windowId: win.id, active: true}, function (tabs) {
			var tab = tabs[0];
			
			chrome.windows.get(tabwinId, function(window) {
				if (typeof(window) == 'undefined'){
					openWindow('maximized');
				}
				else{
					chrome.windows.update(tabwinId, {state: 'maximized'});
					}
				})
			});
		});
	});

//command on hotkeys
// Ctrl-shift-space: open interface
chrome.commands.onCommand.addListener(function(command) {
	console.log(command);
	if (command === 'show-tabview'){
		console.log('show-hotkey');
		chrome.windows.get(tabwinId, function(window) {
			if (window.state != 'minimized'){
				chrome.windows.update(tabwinId, {state: 'minimized'});
			}
			else {
				chrome.windows.update(tabwinId, {state: 'maximized'});
			}
		});
	}
});

//capture visible tab for preview image
function getThumbnail(window){
	chrome.tabs.captureVisibleTab(window,{"format":"png"}, function(imgUrl) {
		chrome.tabs.query({windowId: window, active: true}, function (tabs) {
			//console.log('Image of: ' + tabs[0].title);	
			//console.log(imgUrl);

			//send image to interface
			chrome.runtime.sendMessage({
				image: imgUrl, 
				title: tabs[0].title,
				window: window,
				id: tabs[0].id,
				index: tabs[0].index
			}, function(response) {

			});
		});
	});
}

//save thumbnail on tab activation
chrome.tabs.onActivated.addListener(function(activeInfo) {
	chrome.tabs.get(activeInfo.tabId, function(tab){
		console.log('tab activated: ' + activeInfo.tabId + ': '+ tab.title);		
		if(tab.title != extensionWindowName){
			getThumbnail(tab.windowId);
		}

	});
}); 

//retake thumbnail on tab updated
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	if (changeInfo.status == 'complete'){
		console.log('tab activated: ' + changeInfo.tabId + ': '+ tab.title);

		if (tab.active && tab.title != extensionWindowName){
			getThumbnail(tab.windowId);
		}
	}
}); 

//re-take thumbnail on tab moved
chrome.tabs.onMoved.addListener(function(tabId, moveInfo){
	chrome.tabs.get(tabId, function(tab){
		if(tab.title != extensionWindowName){
			getThumbnail(tab.windowId);
		}
	});
})

//retake thumbnail on tab detached
chrome.tabs.onDetached.addListener(function(tabId, detachInfo){
	chrome.tabs.get(tabId, function(tab){
		if(tab.title != extensionWindowName){
			getThumbnail(tab.windowId);
		}
	});
})

//re-take thumbnail on tab attached
chrome.tabs.onAttached.addListener(function(tabId, attachInfo){
	chrome.tabs.get(tabId, function(tab){
		if(tab.title != extensionWindowName){
			getThumbnail(tab.windowId);
		}
	});
})

//remove thumbnail on tab removal
chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
	console.log('tab removed: ' + tabId);

	//check if exloder is last tab
	chrome.tabs.query({}, function(tabs) { 
		console.log(tabs.length);
		if (tabs.length <= 1) {
			chrome.windows.remove(tabwinId);
		}
	});

	//send removal id to interface
	chrome.runtime.sendMessage({
		id: tabId,
		remove: true
	}, function(response) {});
}); 



