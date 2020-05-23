var lastTab = "";
function openTab(tabName) {
	if (tabName == lastTab) return;

	lastTab = tabName;

	var i, tabcontent, tablinks;
	tabcontent = document.getElementsByClassName("tabcontent");
	for (i = 0; i < tabcontent.length; i++) {
		tabcontent[i].style.display = "none";
	}

	tablinks = document.getElementsByClassName("tablinks");
	for (i = 0; i < tablinks.length; i++) {
		$(tablinks[i]).removeClass("active");
	}

	document.getElementById(tabName).style.display = "block";
	$(document.getElementById(tabName + '-button')).addClass("active");
}



function TabButtonRect(l, r, t, b) {
	this.left = l;
	this.right = r;
	this.top = t;
	this.bottom = b;

	this.contains = function (x, y) {
		return this.left <= x && x <= this.right &&
			   this.top <= y && y <= this.bottom;
	}
	
	this.toString = function() {
		return this.left + "\r\n" + this.right + "\r\n" + this.top + "\r\n" + this.bottom + "\r\n\r\n";
	}
	this.print = function() {
		console.log(this.toString());
	}
}

function getElementPageCoordinates(elem)
{
	var os = $(elem).offset();
	var l = os.left;
	var r = os.left + elem.scrollWidth; //https://stackoverflow.com/questions/10277323/get-real-width-of-elements-with-jquery
	var t = os.top;
	var b = os.top + elem.scrollHeight;

	return new TabButtonRect(l, r, t, b);
}

let rectMap = new Map();
var tabsRect;


function tabTouchMoveEventsFn(e) {
	//console.log("tab hover");
	//console.log(e);
	//document.getElementById("textarea1").value = e.touches[0].pageX + ", " + e.touches[0].pageY + "\r\n";
	var xcoord = e.touches[0].pageX;
	var ycoord = e.touches[0].pageY;
	var targetElement = document.elementFromPoint(xcoord, ycoord);
	
	var tabName;
	if (targetElement) {
		if (targetElement.classList.contains("tablinkicon")) {
			targetElement = targetElement.parentElement;
		}
		
		if (targetElement.classList.contains("tablinks")) {
			tabName = $(targetElement).data("tabname");
		}
	}
	if (!tabName) {
		//document.getElementById("textarea1").value = "";
		return;
	}
  
	//document.getElementById("textarea1").value = tabName;

	console.log(tabName);
	
	openTab(tabName);
}

function turnOnTabTouchMoveEvents() {
	//$("#tabsPanel").on("mouseover", "button", tabTouchMoveEventsFn );
	//$("#tabsPanel").on("mouseover touchmove", "button", tabTouchMoveEventsFn );
	//$("#tab").on("touchmove", ".tablinks", tabTouchMoveEventsFn );
	//document.addEventListener('touchmove', tabTouchMoveEventsFn, false);

	document.getElementById("tabsPanel").addEventListener('touchmove', tabTouchMoveEventsFn, false);
}
function turnOffTabTouchMoveEvents() {
	//$("#tabsPanel").off("mouseover", "button", tabTouchMoveEventsFn );
	//$("#tabsPanel").off("mouseover touchmove", "button", tabTouchMoveEventsFn );
	//$("#tab").off("touchmove", ".tablinks", tabTouchMoveEventsFn );
	//document.removeEventListener('touchmove', tabTouchMoveEventsFn, false);

	document.getElementById("tabsPanel").removeEventListener('touchmove', tabTouchMoveEventsFn, false);
}

				
function InitialiseSortablePlaylist(tabSelector, playlistClass) {
	if (tabSelector === undefined || playlistClass === undefined)
	{
		console.log("Failed to Init sortable.");
		console.log("	tabSelector: "+tabSelector);
		console.log("	group: "+playlistClass);
		return;
	}
	var listSelector = "#" + tabSelector + " " + playlistClass;
	var listElem = $(listSelector).get()[0];

	var s = Sortable.create(listElem, {
		group: playlistClass, // set lists to same group
		handle: '.glyphicon-move',
		chosenClass: 'chosen-item',
		ghostClass: 'ghost-item',
		animation: 0,
		revertOnSpill: true,
		scroll: true,
		bubbleScroll: true,
		scrollSensitivity: 40,
		scrollSpeed: 10,
		forceFallback: true,
		fallbackOnBody: true,
		
		onStart: function (e) {
			//https://github.com/SortableJS/Sortable/issues/1292
			//turnOffTabEvents();
			turnOnTabTouchMoveEvents();
		},
		onEnd: function (e) {
			//https://github.com/SortableJS/Sortable/issues/1292
			turnOffTabTouchMoveEvents();
			//turnOnTabEvents();
		},
		onChoose: function (/**Event*/evt) {
			$(".list-group").removeClass("hoverable-items");
		},
		onUnchoose: function (/**Event*/evt) {
			$(".list-group").addClass("hoverable-items");
		},
	});
	
	var tabElem = document.getElementById(tabSelector + "-button");
	var rect = getElementPageCoordinates(tabElem);

	rectMap.set(tabSelector, [s, rect]);
	
	console.log("Initialised sortable list.");
	console.log("	tabSelector: "+tabSelector);
	console.log("	group: "+playlistClass);
}

function DestroySortablePlaylist(tabSelector) {
	var val = rectMap.get(tabSelector);
	if (!val) return;
	var s = val[0];
	var group = s.options.group.name;

	rectMap.delete(tabSelector);
	s.destroy();
	
	console.log("Destroyed sortable.");
	console.log("	tabSelector: "+tabSelector);
	console.log("	group: "+group);
}

function DestroyAllSortablePlaylist() {
	console.log("Destroying all sortable lists.");
	var tabButtonList = $(".tablinks");
	
	$.each(tabButtonList,function(idx, item){
		DestroySortablePlaylist( $(item).data("tabname") );
	});
	console.log("Destroyed all sortable lists.");
}


//namespaces
//https://www.sitepoint.com/community/t/jquery-calling-function-from-other-script/8006/4
var playlistUI = null;
var callbackTabButtons = null;

function setupPlaylistNamespace() {
	playlistUI = {
		setCallbackTabButtons : function(f) {
			callbackTabButtons = f;
		},
	};
	
	window.playlistUI = playlistUI;
}

function tabEventsFn() {
	console.log("click tab");

	var tabName = $(this).data("tabname");
	openTab( tabName );
	callbackTabButtons(tabName);
}
function turnOnTabEvents() {
	$("#tab").on("click mouseover touchstart", ".tablinks", tabEventsFn );
}
function turnOffTabEvents() {
	$("#tab").off("click mouseover touchstart", ".tablinks", tabEventsFn );
}

function InitialiseSortableTabs(tabSelector, group) {
	if (tabSelector === undefined || group === undefined)
	{
		console.log("Failed to Init sortable.");
		console.log("	tabSelector: "+tabSelector);
		console.log("	group: "+group);
		return;
	}
	var listSelector = "#" + tabSelector;
	
	console.log(listSelector);
	var listElem = $(listSelector).get()[0];

	var s = Sortable.create(listElem, {
		group: group, // set lists to same group
		/*handle: '.glyphicon-move',*/
		/*chosenClass: 'chosen-item',
		ghostClass: 'ghost-item',*/
		animation: 150,
		revertOnSpill: true,
		scroll: true,
		bubbleScroll: true,
		scrollSensitivity: 40,
		scrollSpeed: 10,
		/*forceFallback: true,
		fallbackOnBody: true,*/
		onStart: function (e) {
			console.log("start");
			turnOffTabEvents();
		},
		onEnd: function (e) {
			console.log("end");
			setTimeout(function () {
				turnOnTabEvents();
			},100);
		},
/*
		onChoose: function (evt) {
			$(".list-group").removeClass("hoverable-items");
		},
		onUnchoose: function (evt) {
			$(".list-group").addClass("hoverable-items");
		},
*/
	});
	
	tabsRect = getElementPageCoordinates(tab);

	turnOnTabEvents();
	setupPlaylistNamespace();

	
	console.log("Initialised sortable tabs.");
	console.log("	tabSelector: "+tabSelector);
	console.log("	group: "+group);
}