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


function tabTouchMoveEventsFn(e) {
	//https://stackoverflow.com/questions/3918842/how-to-find-out-the-actual-event-target-of-touchmove-javascript-event
	var xcoord = e.touches[0].pageX;
	var ycoord = e.touches[0].pageY;
	var targetElement = document.elementFromPoint(xcoord, ycoord);
	
	if (targetElement) {
		var tabName;
		
		if (targetElement.classList.contains("tablinks")) {
			tabName = $(targetElement).data("tabname");
		}
		else if (targetElement.classList.contains("tablinkicon")) {
			tabName = $(targetElement.parentElement).data("tabname");
		}

		if (tabName) {
			console.log(tabName);
			openTab(tabName);
		}
	}
}
function turnOnTabTouchMoveEvents() {
	document.getElementById("tabsPanel").addEventListener('touchmove', tabTouchMoveEventsFn, false);
}
function turnOffTabTouchMoveEvents() {
	document.getElementById("tabsPanel").removeEventListener('touchmove', tabTouchMoveEventsFn, false);
}

let sortablePlaylistsMap = new Map();
let sortableTablist;
var sortCount = 0;

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
		handle: '.fa.fa-arrows',
		chosenClass: 'chosen-item',
		dragClass: 'drag-item',
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
			sortCount = 0;

			//https://github.com/SortableJS/Sortable/issues/1292
			turnOnTabTouchMoveEvents();
			$(".list-group").addClass("background-items");
		},
		onEnd: function (e) {
			$(".list-group").removeClass("background-items");
			//https://github.com/SortableJS/Sortable/issues/1292
			turnOffTabTouchMoveEvents();
			
			if (sortCount == 1)
			{
				console.log("playlist item moved in same list");
				callbackPlaylistItemMoved(false);
			}
			else if (sortCount == 2)
			{
				console.log("playlist item moved to another list");
				callbackPlaylistItemMoved(true, e.item, e.from, e.oldIndex);	
			}
		},
		onChoose: function (e) {
		},
		onUnchoose: function (e) {
		},
		onSort: function (e) {
			/*
			generated move events of interest (for single as well as multi-select):
				move across lists:
					sort x2, add, remove, end

				move within same list:
					sort, onupdate, end
			*/

			//count No. of sort events to distinguish between inter/intra list moves
			sortCount++;
		},
	});
	

	sortablePlaylistsMap.set(tabSelector, s);
	
	console.log("Initialised sortable list.");
	console.log("	tabSelector: "+tabSelector);
	console.log("	group: "+playlistClass);
}

function DestroySortablePlaylist(tabSelector) {
	var s = sortablePlaylistsMap.get(tabSelector);
	if (!s) return;
	var group = s.options.group.name;

	sortablePlaylistsMap.delete(tabSelector);
	s.destroy();
	
	console.log("Destroyed sortable.");
	console.log("	tabSelector: "+tabSelector);
	console.log("	group: "+group);
}

function DestroyAllSortablePlaylists() {
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
var callbackPlaylistItemMoved = null;

function setupPlaylistNamespace() {
	playlistUI = {
		setCallbackTabButtons : function(f) {
			callbackTabButtons = f;
		},
		setCallbackPlaylistItemMoved: function(f) {
			callbackPlaylistItemMoved = f;
		},
		disable : function() {
			sortableTablist.option("disabled", true);

			sortablePlaylistsMap.forEach(function(s){
				s.option("disabled", true);
			});
		},
		enable : function() {
			sortableTablist.option("disabled", false);

			sortablePlaylistsMap.forEach(function(s){
				s.option("disabled", false);
			});
		},
	};
	
	window.playlistUI = playlistUI;
}


function tabEventsFn() {
	console.log("clicked tab");
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
	var listElem = $(listSelector).get()[0];

	sortableTablist = Sortable.create(listElem, {
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
			$(".list-group").removeClass("background-items");
		},
		onUnchoose: function (evt) {
			$(".list-group").addClass("background-items");
		},
*/
	});
	

	turnOnTabEvents();
	setupPlaylistNamespace();

	console.log("Initialised sortable tabs.");
	console.log("	tabSelector: "+tabSelector);
	console.log("	group: "+group);
}