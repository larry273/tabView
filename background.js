// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var tabwinId = null;
var extensionWindowName = "TabView";


openWindow();

function openWindow(state = 'minimized'){
	chrome.windows.create({
		url:chrome.extension.getURL("exploder.html"),
		type: "popup",
		state: state }, function(window){
			tabwinId = window.id;
	});	
}
		  
chrome.browserAction.onClicked.addListener(function(tab) {
	chrome.windows.getCurrent(function (win) {
            chrome.tabs.query({windowId: win.id, active: true}, function (tabs) {
			var tab = tabs[0];
			

			chrome.windows.get(tabwinId, function(window) {
				if (typeof(window) == 'undefined'){
					openWindow('maximized');

					chrome.runtime.sendMessage({tabs: tabList, startUp: true});
				}
				else{
					console.log('sending tab list');
					//chrome.runtime.sendMessage({tabs: tabList, startUp: true});
					chrome.windows.update(tabwinId, {state: 'maximized'});
				}
			})
			
			/*
			 chrome.windows.create({
					url:chrome.extension.getURL("exploder.html") + '?' + win.id,
					type: "popup",
					state:"maximized"
				  }, function(window) {
					  	console.log('sending tab list');
						chrome.runtime.sendMessage({tabs: tabList, startUp: true});
				  });
				  */
			});
			
		});
	});

//command on hotkeys
// Ctrl-shift-space: open interface
chrome.commands.onCommand.addListener(function(command) {
	console.log(command);
	if (command === 'show-exploder'){
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

var tabList = [];

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
				id: tabs[0].id
			}, function(response) {

			});
			
			//save for window opening
			for (let k in tabList) {
				if (tabList[k].id === tabs[0].id) {
					tabList[k].image = imgUrl;
					tabList[k].win = window;
					tabList[k].title = tabs[0].title;
					return;
				}
			}
			tabList.push({win: window, title: tabs[0].title, id: tabs[0].id, image: imgUrl});
		});
	});
}

//msg comms
chrome.runtime.onMessage.addListener(messageReceived);
function messageReceived(msg) {
   //if (msg.tabs == "give-tabs"){
		//chrome.runtime.sendMessage({tabs: tabList, startUp: true});
   //}
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
	}, function(response) {

	});

	var i = tabList.map(function(e) { return e.tabId; }).indexOf(tabId);
	tabList.splice(i, 1);

}); 

//retake thumbnail on tab updated
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	if (changeInfo.status == 'complete'){
		console.log('tab activated: ' + changeInfo.tabId + ': '+ tab.title);

		if (tab.active && tab.title != extensionWindowName){
			getThumbnail(tab.windowId);
		}
		
		/*
		chrome.windows.getCurrent(function (win) {
            chrome.tabs.query({windowId: win.id, active: true}, function (tabs) {
				var currentTab = tabs[0].id;
				
				//switch to updated tab
				chrome.tabs.update(tabId, { active: true });
				//take preview image
				getThumbnail(tab.windowId);
				//switch back to tab
				chrome.tabs.update(currentTab, { active: true });

			});
		});
		*/
	}
}); 

