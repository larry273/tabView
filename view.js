var currentTabs = [];
var tabwinId = null;
var extensionWindowName = "TabView";

chrome.windows.getCurrent(function(win){
	tabwinId = win.id;
});

//fetch existing open tabs
getAllTabs();

//outside click hide window
document.getElementById("container").addEventListener("click", function(){
	chrome.windows.update(tabwinId, {state: 'minimized'});
})

//new tab button
document.getElementById("newTab").addEventListener("click", function(){
	chrome.tabs.create({url: "chrome://newtab", active: false});
	//getAllTabs();
})

//new window button
document.getElementById("newWin").addEventListener("click", function(){
	chrome.windows.create({
		url:"chrome://newtab",
		focused: false
		}, function(window){
			chrome.windows.update(tabwinId, {focused: true});
			createWinDiv(window.id);
	});	
})

//close all button
document.getElementById("closeAll").addEventListener("click", function(){
	currentTabs.forEach(tab => {
		chrome.tabs.remove(tab.id)
	})

	chrome.tabs.query({}, function(tabs){
		if (tabs.length <= 1){
			chrome.windows.remove(tabwinId);
		}
	})
})

//scroll to the bottom
window.scrollTo(0, document.body.scrollHeight);

//switch to window and open tab
function openTab(tabId){
	var tabIdInt = parseInt(tabId);
	var tabWindow = currentTabs.find(x => x.id == tabIdInt).win;
	//set window active, set tab active
	chrome.windows.update(tabWindow, { focused: true }, function() {
		chrome.tabs.update(tabIdInt, { active: true });
	});

	chrome.windows.getCurrent(function(win){
		chrome.windows.update(win.id, {state: 'minimized'});
	});
}

//query all tabs to populate overview without screenshots
function getAllTabs(){
	chrome.tabs.query({}, function(tabs){
		//each tab add with placeholder image
		tabs.forEach(tb => {

			if (tb.title == extensionWindowName){
				return;
			}

			//add blank tabs to overview
			addElement(null, tb.title, tb.id, tb.windowId);

			//populate current tabs array
			for (let k in currentTabs) {
				if (currentTabs[k].id === tb.id) {
					currentTabs[k].title = tb.title;
					//currentTabs[k].image = null;
					currentTabs[k].win = tb.window;
					return;
				}
			}
			currentTabs.push({win: tb.windowId, id: tb.id, title: tb.title, image: null});
            
        });
    });
}

//remove from current tabs
function removeTabRef(tabId){
	//var i = currentTabs.map(function(e) { return e.tabId; }).indexOf(tabId);
	var remove_i = null;
	var tabIdInt = parseInt(tabId);

	for (var i = 0; i < currentTabs.length; i++){
		if (currentTabs[i].id === tabIdInt){
			remove_i = i;
			break;
		}		
	}

	if (remove_i != null){
		currentTabs.splice(remove_i, 1);
	}
}

//switch to window and close tab
function closeTab(tabId){
	var tabIdInt = parseInt(tabId);
	var tabWindow = currentTabs.find(x => x.id == tabIdInt).win;
	chrome.tabs.remove(tabIdInt);
	//chrome.windows.update(tabWindow, { focused: true }, function() {
	//		chrome.tabs.remove(tabIdInt);
	//});

	chrome.windows.update(tabwinId, {focused: true, state: 'maximized'});
	//remove from current tabs
	removeTabRef(tabId);
}

//create html window div
function createWinDiv(win){
	var src = document.createElement("div");
	var container = document.getElementById("container");

	var existingWin = document.getElementsByClassName("window");

	src.id = win;
	src.className = "window";
	var pWin = document.createElement("p");
	var wintitle = "Window " + (existingWin.length + 1);
	pWin.innerHTML = wintitle;
	src.append(pWin);
	container.append(src);

	//make window sortable
	var sortable = Sortable.create(src, {
		animation: 250,
		draggable: ".tab",
		group: 'tabs',
		onEnd: function (/**Event*/evt) {
			var itemEl = evt.item;  // dragged HTMLElement
			evt.to;    // target list
			evt.from;  // previous list
			evt.oldIndex;  // element's old index within old parent
			evt.newIndex;  // element's new index within new parent
			evt.oldDraggableIndex; // element's old index within old parent, only counting draggable elements
			evt.newDraggableIndex; // element's new index within new parent, only counting draggable elements

			//move tab index or window
			moveTab(itemEl, evt.newDraggableIndex, evt.to, evt.from);
		},

	});
	return src;
}

//add element to interface
function addElement(imageSrc, title, id, win){
	//placeholder image
	if (typeof(imageSrc) == 'undefined' || imageSrc == null){
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
	div.className = "tab";
	
	var img = document.createElement("img");
	img.src = imageSrc;
	//add on click functionality
	img.addEventListener("click", function(){
		event.stopPropagation()
		openTab(this.parentNode.id);
	})
	
	//close button and listener
	var close = document.createElement("img");
	close.className = "close";
	close.src = "images/close.png";
	close.addEventListener("click", function(){
		event.stopPropagation()
		closeTab(this.parentNode.id);
	})

	var p = document.createElement("p");
	var tabTitle = title;
	p.innerHTML = tabTitle;
	
	//add to window div, create if not exists
	if(document.getElementById(win)){
		var src = document.getElementById(win); 
	}
	else{
		var src = createWinDiv(win);
	}

	//add div to html
	div.appendChild(p);
	div.appendChild(close)
	div.appendChild(img);
	src.appendChild(div);

	//scroll to the bottom
	document.getElementById('container').scrollIntoView({ behavior: 'smooth', block: 'end' });

}

//move tab location
function moveTab(tab, index, win, oldWin){
	var tabId = parseInt(tab.id);
	var winId = parseInt(win.id);

	chrome.tabs.move(tabId, {windowId: winId, index: index});
	removeWindowEl(oldWin);

	for (let k in currentTabs) {
		if (currentTabs[k].id === tabId) {
			currentTabs[k].win = winId;
		}
	}
}

//remove div from overview
function removeElement(id){
	var elem = document.getElementById(id);//.remove();

	var window = elem.parentElement;
	elem.remove();
	removeWindowEl(window);
}

//check to remove window element
function removeWindowEl(el){
	if (el.childNodes.length <= 1){
		el.remove();
	}

	//rename all window elements
	var winEls = document.getElementsByClassName("window");
	for (var i = 0; i < winEls.length; i++){
		winEls[i].firstChild.innerHTML = "Window " + (i + 1);
	}
}

//msg comms
chrome.runtime.onMessage.addListener(messageReceived);
function messageReceived(msg) {
	if (msg.remove){
		removeElement(msg.id);
		removeTabRef(msg.id);
	}
	else{
		addElement(msg.image, msg.title, msg.id, msg.window);
		
		//update existing value if exists
		for (let k in currentTabs) {
			if (currentTabs[k].id === msg.id) {
				currentTabs[k].title = msg.title;
				currentTabs[k].image = msg.image;
				currentTabs[k].win = msg.window;
				return;
			}
		}
		//add tab to total list
		currentTabs.push({win: msg.window, id: msg.id, title: msg.title, image: msg.image});
	}
}

//search tab list
document.getElementById("searchBar").onkeyup = searchTabs;
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