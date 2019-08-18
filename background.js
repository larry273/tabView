// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.


chrome.browserAction.onClicked.addListener(function(tab) {
	chrome.windows.getCurrent(function (win) {
            chrome.tabs.query({windowId: win.id, active: true}, function (tabs) {
			var tab = tabs[0];
			
			 chrome.windows.create({
					url:chrome.extension.getURL("exploder.html") + '?' + win.id,
					type: "popup",
					state:"maximized"
				  });
			});
		});
	});

//command on hotkeys
// Ctrl-shift-space: open interface
chrome.commands.onCommand.addListener(function(command) {
	console.log('Command:', command);
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
				id: tabs[0].id
			}, function(response) {

			});

		});
	});
}

//msg comms
chrome.runtime.onMessage.addListener(messageReceived);
function messageReceived(msg) {
   // Do your work here
}


//save thumbnail on tab activation
chrome.tabs.onActivated.addListener(function(activeInfo) {
	chrome.tabs.get(activeInfo.tabId, function(tab){
		console.log('tab activated: ' + activeInfo.tabId + ': '+ tab.title);		
		getThumbnail(tab.windowId);

	});
}); 

//remove thumbnail on tab removal
chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
	console.log('tab removed: ' + tabId);
	console.log('remove image here');

	//send removal id to interface
	chrome.runtime.sendMessage({
		id: tabId,
		remove: true
	}, function(response) {

	});

}); 

//retake thumbnail on tab updated
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	if (changeInfo.status == 'complete'){
		console.log('tab activated: ' + changeInfo.tabId + ': '+ tab.title);
		console.log('retake image here');
		
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
