
var currentTabs = [];
var tabwinId = null;
chrome.windows.getCurrent(function(win){
	tabwinId = win.id;
});


//switch to window and open tab
function openTab(tabId){
	var tabIdInt = parseInt(tabId);
	var tabWindow = currentTabs.find(x => x.id == tabIdInt).win;
	chrome.windows.update(tabWindow, { focused: true }, function() {
		chrome.tabs.update(tabIdInt, { active: true });
	});

	chrome.windows.getCurrent(function(win){
		chrome.windows.update(win.id, {state: 'minimized'});
	});
}

//remove from current tabs
function removeTabRef(tabId){
	var i = currentTabs.map(function(e) { return e.tabId; }).indexOf(tabId);
	currentTabs.splice(i, 1);
}

//switch to window and close tab
function closeTab(tabId){
	var tabIdInt = parseInt(tabId);
	var tabWindow = currentTabs.find(x => x.id == tabIdInt).win;
	chrome.windows.update(tabWindow, { focused: true }, function() {
		chrome.tabs.remove(tabIdInt);
	});

	chrome.windows.update(tabwinId, {focused: true, state: 'maximized'});
	//remove from current tabs
	removeTabRef(tabId);
	//var i = currentTabs.map(function(e) { return e.tabId; }).indexOf(tabId);
	//currentTabs.splice(i, 1);

}

function addElements(tabs){
	var i;
	for (i = 0; i < tabs.length; i++) { 
		addElement(tabs[i].image, tabs[i].title, tabs[i].id);
	}
	currentTabs = tabs;
}

//add element to interface
function addElement(imageSrc, title, id){
	//placeholder image
	if (typeof(imageSrc) == 'undefined'){
		imageSrc = 'images/blank.png';
	}
	
	//update existing id if already exists
	var el = document.getElementById(id);
	if (typeof(el) != 'undefined' && el != null){
		el.children[2].src = imageSrc;
		el.children[0].innerHTML = title;
		return;
	}

	//set tab id to div of element
	var div = document.createElement("div");
	div.id = id;
	
	var img = document.createElement("img");
	img.src = imageSrc;
	//add on click functionality
	img.addEventListener("click", function(){
		openTab(this.parentNode.id);
	})
	
	//close button and listener
	var close = document.createElement("img");
	close.className = "close";
	close.src = "images/close.png";
	close.addEventListener("click", function(){
		closeTab(this.parentNode.id);
	})

	var p = document.createElement("p");
	var tabTitle = title;
	p.innerHTML = tabTitle;
	
	var src = document.getElementById("container");

	//add div to html
	div.appendChild(p);
	div.appendChild(close)
	div.appendChild(img);
	src.appendChild(div);
}

//remove div from overview
function removeElement(id){
	document.getElementById(id).remove();
	removeTabRef(id);
}
/*
chrome.tabs.captureVisibleTab(null,{"format":"png"}, function(imgUrl) {	
	chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
		var tabTitle = tabs[0].title;
		
		var img = document.createElement("img");
	
		img.src = imgUrl;
		var src = document.getElementById("card");
		
		var p = document.createElement("p");
		
		p.innerHTML = tabTitle;
		
		src.appendChild(p);
		src.appendChild(img);
	});
});    
*/

//msg comms
chrome.runtime.onMessage.addListener(messageReceived);
function messageReceived(msg) {
	if (msg.startUp){
		console.log('recieving tab list');
		addElements(msg.tabs);
	}
	else if (msg.remove){
		removeElement(msg.id);
	}
	else{
		addElement(msg.image, msg.title + ':' + msg.id, msg.id);
		
		for (let k in currentTabs) {
			if (currentTabs[k].id === msg.id) {
				return;
			}
		}
		currentTabs.push({win: msg.window, id: msg.id, title: msg.title, image: msg.image});
	}
}

document.getElementById("searchBar").onkeyup = searchTabs;

//search tab list
function searchTabs(){
	var i, title, input, txtVal, filter, div;
	input = document.getElementById("searchBar");
	filter = input.value.toUpperCase();


	for (i = 0; i < currentTabs.length; i++){
		
		title = currentTabs[i].title;
		div = document.getElementById(currentTabs[i].id);
		if (filter === ""){
			div.style.display = "";
		}
		else if(title.toUpperCase().indexOf(filter) > -1){
			div.style.display = "";
		} 
		else {
			div.style.display = "none";
		}
	}
}