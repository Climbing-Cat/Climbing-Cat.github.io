function convertToSeconds(input) {
	var parts = input.split(':'),
		hours = +parts[0],
		minutes = +parts[1],
		seconds = +parts[2];
	return +( (hours * 3600) + (minutes * 60) + seconds).toFixed(2);
}

function convertFromSeconds(totalSeconds) {
	hours = Math.floor(totalSeconds / 3600);
	totalSeconds %= 3600;
	minutes = Math.floor(totalSeconds / 60);
	seconds = Math.floor(totalSeconds % 60);
	
	return ('0'+hours).slice(-2) + ":" + ('0'+minutes).slice(-2) + ":" + ('0'+seconds).slice(-2);
}

var mouseX = 0;
var mouseY = 0;
function cacheMouseEventCoords(event) {
	mouseX = event.clientX;
	mouseY = event.clientY;
}

 

function InitControls(_player) {
	console.log("controls Init");
	
	var player = _player;
	var settingTimeToRsMarker2 = false;
	var ignorePauseAtEndMarker = false;
	var backedUpTimes = ['0', '0'];
	
	var tempDuration = 195;//6000; //11574.073878
	
	var dialRadius = 58;
	var dialHandleSize = 36;
	
	var timeBarWidth = 328;
	var timeBarOffsetLeft = 193;
	var draggingRangeSlider1 = false;
	var draggingRangeSlider2 = false;

	var dial2Locked = true;		//used for tracking with play scrubber
	var canUnlockDial2ByClickNoMoveRsHandle2 = true;
	
	var containDialsWithinRangeSlider = false;

	
	var slider = document.getElementById('noUiSlider');

	noUiSlider.create(slider, {
		oldFrom: 0,	//custom option: to be able to identify which handle was updated (when clicking the bar it's ambiguous)
		oldTo: 0,	//custom option: to be able to identify which handle was updated (when clicking the bar it's ambiguous)

		start: [0, 0],
		connect: true,
		range: {
		'min': 0,
		'max': tempDuration
		}
	});

	document.getElementsByClassName("noUi-base")[0].addEventListener("mousedown",   cacheMouseEventCoords);
	document.getElementsByClassName("noUi-handle")[0].addEventListener("mousedown", cacheMouseEventCoords);
	document.getElementsByClassName("noUi-handle")[1].addEventListener("mousedown", cacheMouseEventCoords);

	
	slider.noUiSlider.on('start', function (values, handle, unencoded, tap) {
		slider.noUiSlider.options.oldFrom = unencoded[0]; //from
		slider.noUiSlider.options.oldTo = unencoded[1];   //to
	});

	slider.noUiSlider.on('slide', function (values, handle, unencoded, tap) {				
		if (handle == 0) {
			draggingRangeSlider1 = true;
			setDialTime(myDial1, unencoded[0]);

			if (callbackSetA) callbackSetA(unencoded[0]);
		}
		else if (handle == 1) {
			draggingRangeSlider2 = true;
			if (dial2Locked)
			{
				unlockDial2();
			}
			//else
			{
				if (callbackSetB) callbackSetB(unencoded[1]);
			}

			setDialTime(myDial2, unencoded[1]);
		}			
	});
	
	slider.noUiSlider.on('change', function (values, handle, unencoded, tap) {
		var handle2NeedsUnlocking = false;
		var changePlayerTime = false;
		var dial = null;


		if (!draggingRangeSlider2 && unencoded[1] == slider.noUiSlider.options.oldTo   &&
			!draggingRangeSlider1 && unencoded[0] == slider.noUiSlider.options.oldFrom &&
			unencoded[1]-unencoded[0] < 8
		)
		{
			var mouseProportion = (mouseX - (timeBarOffsetLeft-11) - 13) / timeBarWidth; //(-zeroOffset - left margin) / timeline width
			var mouseTime = tempDuration * mouseProportion;
			var mid = (unencoded[1] + unencoded[0]) / 2;
			//console.log("mousePercentage:"+ (mouseProportion*100));
			//console.log("mouseTime:"+mouseTime);
			//console.log("mid:"+mid);
			
			if (mouseTime < mid)
			{
				handle = 0;
				$("#noUiSlider > .noUi-base > .noUi-origin > .noUi-handle-lower").parent().css("z-index", "5");
				$("#noUiSlider > .noUi-base > .noUi-origin > .noUi-handle-upper").parent().css("z-index", "4");
			}
			else
			{
				handle = 1;
				$("#noUiSlider > .noUi-base > .noUi-origin > .noUi-handle-upper").parent().css("z-index", "5");
				$("#noUiSlider > .noUi-base > .noUi-origin > .noUi-handle-lower").parent().css("z-index", "4");
			}
		}
		
		if (handle == 1 && !draggingRangeSlider2 && unencoded[1] == slider.noUiSlider.options.oldTo)
		{
			if (dial2Locked)
			{
				if (canUnlockDial2ByClickNoMoveRsHandle2) {
					handle2NeedsUnlocking = true;
					if (callbackSetB) callbackSetB(unencoded[1]);
				}
			}
			else
			{
				dial = myDial2;
				changePlayerTime = true;
			}
		}
		else if (handle == 0 && !draggingRangeSlider1 && unencoded[0] == slider.noUiSlider.options.oldFrom)
		{
			handle2NeedsUnlocking = true;

			dial = myDial1;
			changePlayerTime = true;
		}

		if (handle2NeedsUnlocking)
		{
			unlockDial2();
			console.log("unlocking handle 2");
		}

		if (changePlayerTime)
		{								
			console.log("changePlayerTime");

			var currentPlayerTime = Math.floor(player.getCurrentTime());
			var dialValue = (dial.options.lap * dial.options.max) + dial.options.value;

			if (dialValue != currentPlayerTime)
			{
				var pausedOld = paused;

				if (!pausedOld) player.pause();

				settingTimeToRsMarker2 = handle == 1;
				player.setCurrentTime(dialValue);
				
				if (!pausedOld) player.play();
			}
		}
		
		if (paused && draggingRangeSlider2)
		{
			settingTimeToRsMarker2 = false;
			ignorePauseAtEndMarker = false;
		}
	});

	slider.noUiSlider.on('end', function (values, handle, unencoded, tap) {
		if (draggingRangeSlider1 && handle == 0) {
			draggingRangeSlider1 = false;
			slider.noUiSlider.options.oldFrom = unencoded[0];
		}
		if (draggingRangeSlider2 && handle == 1) {
			draggingRangeSlider2 = false;
			slider.noUiSlider.options.oldTo = unencoded[1];

		}  
	});

	slider.noUiSlider.on('set', function (values, handle, unencoded, tap) {
		
		if (handle == 0 && draggingRangeSlider1) {
			if (callbackSetA) callbackSetA(unencoded[0]);
		}
		else if (handle == 1 && draggingRangeSlider2) {
			if (callbackSetB) callbackSetB(unencoded[1]);
		}
		
		if (!tap) return;
		if (handle == 0) draggingRangeSlider1 = false;
		else if (handle == 1) draggingRangeSlider2 = false;
	});

	slider.noUiSlider.on('update', function (values, handle, unencoded, tap) {
		if (paused && handle == 1 && !draggingRangeSlider1 && unencoded[1] != slider.noUiSlider.options.oldTo) //dial 2 updated while paused
		{
			settingTimeToRsMarker2 = false;
			ignorePauseAtEndMarker = false;
		}
		
		slider.noUiSlider.options.oldFrom = unencoded[0]; //from
		slider.noUiSlider.options.oldTo = unencoded[1];   //to
	});


	/////////////////////////////////////////////////////////

	function refreshAllSlidersUI()
	{
		function readjustRangeSliderUI(timeBar)
		{
			var timeBarOffset = timeBar.offset();
			timeBarOffsetLeft = timeBarOffset.left;

			$("#nusDiv").width(timeBarWidth);
			
			timeBarOffset.top += 26;
			$("#nusDiv").offset(timeBarOffset);
		}
		
		function setDialsPositions(timeBar)
		{
			var timeBarOffset = timeBar.offset();
			
			//timeBarOffset.top  += 26;
			timeBarOffset.top  += dialRadius + dialHandleSize /2;
			
			timeBarOffset.left -= containDialsWithinRangeSlider ? -dialHandleSize/2 : dialRadius;
			$("#dial1box").offset(timeBarOffset);

			timeBarOffset.left -= containDialsWithinRangeSlider ? dialRadius*2 + dialHandleSize: 0;
			timeBarOffset.left += timeBarWidth;
			$("#dial2box").offset(timeBarOffset);
		}

		var timeBar = $('.mejs__time-total');
		timeBarWidth = timeBar.width();
		readjustRangeSliderUI(timeBar);
		setDialsPositions(timeBar);
	}
	

/////////////////////////////////////////////////////////


//#### Customization to achieve the dial funcationality ####//
	var dialDuration = 0; //e.g. seconds
	var dialStartTime = 0;
	var dialMax = 60;
	
	var maxLap = 0;
	var maxLapMaxVal = 0
	var dialStartLap = 0
	var dialStartValue = 0;

	
	function setDialDuration(duration)
	{
		duration = Math.floor(duration); //quick hack. is this solution realistic?. e.g.: mp3 duration could be 4342.700563 but the media player only displays 4342s!!!
		dialDuration = duration;
		
		maxLap = Math.floor( Math.max((dialDuration-1), 0) / dialMax );
		
		maxLapMaxVal = dialDuration - (maxLap*dialMax);
		dialStartTime = 0;
		
		if (dialStartTime < 0) dialStartTime = 0
		else if (dialStartTime > dialDuration) dialStartTime = dialDuration;

		dialStartLap = Math.floor( Math.max((dialStartTime-1), 0) / dialMax ); //avoid -1 when starttime=0
		dialStartValue = dialStartTime - (dialStartLap*dialMax);
	}
	

	$.fn.roundSlider.prototype.defaults.lap = 0;
	var fn1 = $.fn.roundSlider.prototype._changeSliderValue;
	$.fn.roundSlider.prototype._changeSliderValue = function (newValue, angle) {
		var o = this.options, startQuarter = o.max * 0.25, endQuarter = o.max * 0.75, preValue = o.value;
		if(preValue >= endQuarter && newValue <= startQuarter) this.options.lap++;
		if(preValue <= startQuarter && newValue >= endQuarter) this.options.lap--;


		var relativeMinLap = 0;
		var relativeMinLapMaxVal = 0;
		var relativeMaxLap = maxLap;
		var relativeMaxLapMaxVal = maxLapMaxVal;

		if (o.dialNum == 1 && myDial2 != null)
		{
			relativeMaxLap = myDial2.options.lap;
			relativeMaxLapMaxVal = myDial2.options.value;
		}

		if (o.dialNum == 2 && myDial1 != null)
		{
			relativeMinLap = myDial1.options.lap;
			relativeMinLapMaxVal = myDial1.options.value;
		}

		var preAngle = o.preAngle;

		//following logic clamps the dragging of the handle only, not the click and go to sliding animation
		if (this.options.lap == relativeMaxLap && newValue > relativeMaxLapMaxVal) {
			newValue= preValue;
			angle = preAngle;
		}
		else if (this.options.lap == relativeMinLap && newValue < relativeMinLapMaxVal) {
			newValue= preValue;
			angle = preAngle;
		}
		else {
			preAngle = angle;
			o.preAngle = preAngle;
		}

		if(this.options.lap < relativeMinLap) this.options.lap = relativeMinLap;
		else if(this.options.lap > relativeMaxLap) this.options.lap = relativeMaxLap;
		else fn1.apply(this, arguments);
	}
//#### ---------------------------- ####//


	var myDial1 = null;
	var myDial2 = null;
	

	function createRoundSlider(dialNum, dialID) {

//#### Helper/common functions and vars: due to click-and-slide behaviour correction. Tested with round-slider@1.5.1 ####//
		var cancelledValueChange = false;
		var cancelledValue = 0;
		var ignoreUpdateToolTip = false;
		var lastFormattedTooltip = null;
		var noAnimationSoDontWaitForAnEvent = false;

		
		// Function from David Walsh: http://davidwalsh.name/css-animation-callback
		function whichTransitionEvent(){
		  var t,
			  el = document.createElement("fakeelement");

		  var transitions = {
			"transition"      : "transitionend",
			"OTransition"     : "oTransitionEnd",
			"MozTransition"   : "transitionend",
			"WebkitTransition": "webkitTransitionEnd"
		  }

		  for (t in transitions){
			if (el.style[t] !== undefined){
			  return transitions[t];
			}
		  }
		}
		var transitionEvent = whichTransitionEvent();

		
		function commonPhase2(myDial, lapIncrement, midAlternativeDialVal, finalDialVal) {
			myDial.options.lap += lapIncrement;

			if (myDial.options.animation) myDial.control.removeClass("rs-animation");

			if (midAlternativeDialVal == finalDialVal)
			{
				noAnimationSoDontWaitForAnEvent = true;
				ignoreUpdateToolTip = false;
			}

			myDial.setValue(midAlternativeDialVal);
			ignoreUpdateToolTip = false;

			if (myDial.options.animation) myDial.control.addClass("rs-animation");
			
			if (!noAnimationSoDontWaitForAnEvent)
				myDial.setValue(finalDialVal);
		}


		function commonPhase3(myDial) {
			cancelledValue = 0;
			cancelledValueChange = false;
			ignoreUpdateToolTip = false;
			myDial.options.readOnly = false;
		}

		
		function beforeValueChange__click_and_slide_behaviour_correction(args)
		{
			var action = args.action;
			var preValue = myDial.options.value;
			var value = args.value;

			if (!(action == "change" && args.isUserAction)) return true;

			var relativeMinLap;
			var relativeMinLapMaxVal;
			var relativeMaxLap;
			var relativeMaxLapMaxVal;

			if (dialNum == 1)
			{
				relativeMinLap = 0;
				relativeMinLapMaxVal = 0;

				relativeMaxLap = myDial2.options.lap;
				relativeMaxLapMaxVal = myDial2.options.value;
			}
			else if (dialNum == 2)
			{
				relativeMinLap = myDial1.options.lap;
				relativeMinLapMaxVal = myDial1.options.value;

				relativeMaxLap = maxLap
				relativeMaxLapMaxVal = maxLapMaxVal;
			}
			
			
			if (preValue < value && value - preValue > dialMax /2)
			{
				//uh oh, we're going to cross the zero start boundary heading counter clockwise
				
				myDial.options.readOnly = true;
				cancelledValueChange = true;
				cancelledValue = value;


				if (myDial.options.lap > relativeMinLap) {
					ignoreUpdateToolTip = true;

					if (preValue == 0) noAnimationSoDontWaitForAnEvent = true;
					else
						myDial.setValue(0);
						
					if (myDial.options.lap == relativeMinLap +1)
						cancelledValue = Math.max(cancelledValue, relativeMinLapMaxVal);
				}
				else if (myDial.options.lap == relativeMinLap) {
					ignoreUpdateToolTip = false;

					myDial.setValue(relativeMinLapMaxVal);
					//no need for phase2

					commonPhase3(myDial);
					return false;
				}


				if (myDial.options.animation) {
					function commonAnimatedPhase2and3()
					{
						noAnimationSoDontWaitForAnEvent = false;

						commonPhase2(myDial, -1, dialMax, cancelledValue);

						if (noAnimationSoDontWaitForAnEvent) commonPhase3(myDial);
						else
						{
							myDial.control.one(transitionEvent,	function(event) { commonPhase3(myDial); });
						}
					}
					
					if (noAnimationSoDontWaitForAnEvent) commonAnimatedPhase2and3();
					else {
						//https://jonsuh.com/blog/detect-the-end-of-css-animations-and-transitions-with-javascript/					
						myDial.control.one(transitionEvent, function(event) { commonAnimatedPhase2and3(); });
					}
				}
				else {
					commonPhase2(myDial, -1, dialMax, cancelledValue);
					commonPhase3(myDial);							
				}

				return false;
			}
			
			else if (value < preValue && preValue - value > dialMax /2)
			{
				//uh oh, we're going to cross the zero start boundary heading clockwise
				
				myDial.options.readOnly = true;
				cancelledValueChange = true;
				cancelledValue = value;


				if (myDial.options.lap < relativeMaxLap) {
					ignoreUpdateToolTip = true;

					if (preValue == dialMax) noAnimationSoDontWaitForAnEvent = true;
					else
						myDial.setValue(dialMax);
						
					if (myDial.options.lap == relativeMaxLap -1)
						cancelledValue = Math.min(cancelledValue, relativeMaxLapMaxVal);
				}
				else if (myDial.options.lap == relativeMaxLap) {
					ignoreUpdateToolTip = false;

					myDial.setValue(relativeMaxLapMaxVal);
					//no need for phase2

					commonPhase3(myDial);
					return false;
				}
				

				if (myDial.options.animation) {
					function commonAnimatedPhase2and3()
					{
						noAnimationSoDontWaitForAnEvent = false;
						commonPhase2(myDial, 1, 0, cancelledValue);
						if (noAnimationSoDontWaitForAnEvent) commonPhase3(myDial);
						else
						{
							myDial.control.one(transitionEvent,	function(event) { commonPhase3(myDial); });
						}
					}
					
					if (noAnimationSoDontWaitForAnEvent) commonAnimatedPhase2and3();
					else {
						//https://jonsuh.com/blog/detect-the-end-of-css-animations-and-transitions-with-javascript/					
						myDial.control.one(transitionEvent, function(event) { commonAnimatedPhase2and3(); });
					}
				}
				else {
					commonPhase2(myDial, 1, 0, cancelledValue);
					commonPhase3(myDial);
				}

				return false;
			}
			else if (preValue < value && value - preValue < dialMax /2)
			{
				//clockwise no zero boundary crossing special case trying to slide passed relativeMaxLapMaxVal.
				//roundSlider's default behaviour does not move the slider to relativeMaxLapMaxVal
				if (myDial.options.lap == relativeMaxLap && preValue != relativeMaxLapMaxVal) {
					cancelledValue = Math.min(value, relativeMaxLapMaxVal);
					cancelledValueChange = true;
					myDial.options.readOnly = true;

					
					myDial.setValue(cancelledValue);
					
					if (myDial.options.animation) {
						myDial.control.one(transitionEvent,	function(event) { commonPhase3(myDial); });
					}
					else commonPhase3(myDial);

					return false;
				}

				return true;
			}
			else {
				//counter clockwise no zero boundary crossing special case trying to slide passed relativeMinLapMaxVal.
				//roundSlider's default behaviour does not move the slider to relativeMinLapMaxVal? definitely the case for counter clockwise. needed for 'relative' to first dial

				if (myDial.options.lap == relativeMinLap && preValue != relativeMinLapMaxVal) {
					cancelledValue = Math.max(value, relativeMinLapMaxVal);
					cancelledValueChange = true;
					myDial.options.readOnly = true;

					
					myDial.setValue(cancelledValue);
					
					if (myDial.options.animation) {
						myDial.control.one(transitionEvent,	function(event) { commonPhase3(myDial); });
					}
					else commonPhase3(myDial);

					return false;
				}
				return true;
			}
		}
//#### Helper/common functions and vars: due to click-and-slide behaviour correction. Tested with round-slider@1.5.1 ####//

		var myDial = null;
		
		$(dialID).roundSlider({
			dialNum: dialNum,	//custom option: self reference. also used for clamping logic for dragging and sliding handle, calling back into rangeslider for correct handle
			preAngle: 0,		//custom option: used for clamping logic for dragging handle
			editableTooltip: false,
			startAngle: 0,
			max: dialMax,
			lap: dialStartLap,
			value: dialStartValue,
			radius: dialRadius,
			width: 10,
			handleSize: "+"+dialHandleSize,
			handleShape: "dot",

			
			create: function() {
				myDial = $(dialID).data("roundSlider");
			},

			beforeValueChange: function(args) {
				if (dialNum == 2 && !draggingRangeSlider2 && args.isUserAction && dial2Locked)
				{
					unlockDial2();
				}

				return beforeValueChange__click_and_slide_behaviour_correction(args);
			},			
			tooltipFormat: function (e) {
				if (ignoreUpdateToolTip) return lastFormattedTooltip; //due to click-and-slide behaviour correction
				var o = this.options;

				var dialTime = (o.lap * o.max) + e.value;
				
				
				if (dialNum == 1 && !draggingRangeSlider1)      //breaks cyclic event updates between range slider and round slider
				{
					slider.noUiSlider.setHandle(0, dialTime, true);
					
					if (myDial && myDial.options.dialNum == 1 && callbackSetA) callbackSetA(dialTime);
				}
				else if (dialNum == 2 && !draggingRangeSlider2) //breaks cyclic event updates between range slider and round slider
				{
					slider.noUiSlider.setHandle(1, dialTime, true);
					
					//if (!dial2Locked)
					{
						if (myDial && myDial.options.dialNum == 2 && callbackSetB) callbackSetB(dialTime);
					}
				}
				
				lastFormattedTooltip = convertFromSeconds(dialTime); //due to click-and-slide behaviour correction
				return lastFormattedTooltip;
			} //tooltip format
		}); //roundslider ctor
		
		return myDial;
	} //createRoundSlider
	
	
	function updateDials(duration)
	{
		if (myDial1 != null) $("#dial1").roundSlider("destroy");
		if (myDial2 != null) $("#dial2").roundSlider("destroy");
		
		setDialDuration(duration);

		myDial1 = createRoundSlider(1, "#dial1");
		myDial2 = createRoundSlider(2, "#dial2");	
	}

	myDial1 = createRoundSlider(1, "#dial1");
	myDial2 = createRoundSlider(2, "#dial2");
	setDialDuration(tempDuration); //this call here is for dial testing purposes - avoids having to load media. remove when note needed


	function checkEnforceTimeWithinDialLimits(dialTime) {
		if (dialTime < 0) return 0
		else if (dialTime > dialDuration) return dialDuration;
		else return dialTime;
	}
	
	function setDialTimeNoChecks(myDial, dialTime) {
		var dialLap = Math.floor( Math.max((dialTime-1), 0) / dialMax ); //avoid -1 when starttime=0
		var dialValue = dialTime - (dialLap*dialMax);
		if (myDial.options.animation) myDial.control.removeClass("rs-animation");
		myDial.options.lap = dialLap;
		myDial.options.value = -1; //invalidate hack. Otherwise different times having same dial value (with different lap val) will not force set handle or update dial tooltip!!!
		myDial.setValue(dialValue);
		if (myDial.options.animation) myDial.control.addClass("rs-animation");
	}
	
	function setDialTime(myDial, dialTime, args) {
		var force = args && args.force ? args.force : false;
		var forced = false;
		var retObj = {forced: false, match: false};
		
		dialTime = checkEnforceTimeWithinDialLimits(dialTime);

		var dial1Value = (myDial1.options.lap * myDial1.options.max) + myDial1.options.value;
		var dial2Value = (myDial2.options.lap * myDial2.options.max) + myDial2.options.value;

		if (!force) //check and clamp against other dial
		{
			if (myDial.options.dialNum == 1) {
				if (dial1Value == dialTime) return retObj;
				if (dial2Value < dialTime) dialTime = dial2Value;
			}
			else if (myDial.options.dialNum == 2) {
				if (dial2Value == dialTime) return retObj;
				if (dial1Value > dialTime) dialTime = dial1Value;
			}

			//setDialTimeNoChecks(myDial, dialTime);
		}
		else {
			var otherDial = null;
			
			if (myDial.options.dialNum == 1) {
				if (dial1Value == dialTime) return retObj;
				if (dial2Value < dialTime) otherDial = dial2;
				else if (dial2Value == dialTime) retObj.match = true;
			}
			else if (myDial.options.dialNum == 2) {
				if (dial2Value == dialTime) return retObj;
				if (dial1Value > dialTime)  otherDial = dial1;
				else if (dial1Value == dialTime) retObj.match = true;
			}
			
			if (otherDial)
			{
				setDialTimeNoChecks(otherDial, dialTime);
				retObj.forced = true;
			}
		}
		
		setDialTimeNoChecks(myDial, dialTime);
		return retObj;
	}
	
	function setDialTimes(dialTime1, dialTime2) {
		unlockDial2();
		
		dialTime1 = checkEnforceTimeWithinDialLimits(dialTime1);
		dialTime2 = checkEnforceTimeWithinDialLimits(dialTime2);

		if (dialTime1 > dialTime2) {//swap
			var t = dialTime1;
			dialTime1 = dialTime2;
			dialTime2 = t;
		}
		
		var dial1Value = (myDial1.options.lap * myDial1.options.max) + myDial1.options.value;
		var dial2Value = (myDial2.options.lap * myDial2.options.max) + myDial2.options.value;

		if (dialTime1 > dial2Value)
		{
			setDialTimeNoChecks(myDial2, dialTime2);
			setDialTimeNoChecks(myDial1, dialTime1);
		}
		else
		{
			setDialTimeNoChecks(myDial1, dialTime1);
			setDialTimeNoChecks(myDial2, dialTime2);
		}
	}


	jQuery('.rsSetTime').click(function() {
		var dialId = $(this).data("dial-id"); //NB data attributes should be in lower case. Chrome doesn't seem to pick them up straight away!?!?!
		if (dialId == undefined) return;

		var dial = null;
		if (dialId == 1 && myDial1) dial = myDial1;
		else if (dialId == 2 && myDial2) dial = myDial2;
		
		if (dial) {
			var dialTime = $(this).data("dial-time");
			if (dialTime == undefined) return;

			var force = $(this).data("force");
			force = (force) ? force : false;
			setDialTime(dial, dialTime, {force:force});
		}
	});

	jQuery('.rsSetTimes').click(function() {
		if (myDial1 && myDial2) {
			var dial1Time = $(this).data("dial-1-time");
			var dial2Time = $(this).data("dial-2-time");
			if (dial1Time == undefined || dial2Time == undefined ) return;

			setDialTimes(dial1Time, dial2Time);					
		}
	});


	function lockDial2()
	{
		if (dial2Locked) return;
		dial2Locked = true;
		$('#lockDial2').hide();
		$('#setDial2').show();
	}
	
	function unlockDial2()
	{
		dial2Locked = false;
		$('#setDial2').hide();
		$('#lockDial2').show();
	}
	
	function lockSyncAndSetDial2(dialTime)
	{
		lockDial2();
		setDialTime(myDial2, dialTime, {force:true});
	}

	function SyncAndSetDial1(dialTime)
	{
		var result = setDialTime(myDial1, dialTime, {force:true});
		if ((result.forced || result.match) && !dial2Locked)
			lockSyncAndSetDial2(dialTime);
	}
	
	jQuery('#setDial1').click(function() {
		var t = Math.floor(player.getCurrentTime());
		SyncAndSetDial1(t);
		
		if (callbackSetA) callbackSetA(t);
	});

	jQuery('#setDial2').click(function() {
		unlockDial2();
		
		var dial2Value = (myDial2.options.lap * myDial2.options.max) + myDial2.options.value;

		if (callbackSetB) callbackSetB(dial2Value);
	});

	jQuery('#lockDial2').click(function() {
		lockSyncAndSetDial2(Math.floor(player.getCurrentTime()));
	});

	function createSnippet() {
		var pausedOld = paused;
		
		if (!pausedOld)
			player.pause();
		
		var dial1Value = (myDial1.options.lap * myDial1.options.max) + myDial1.options.value;
		var dial2Value = (myDial2.options.lap * myDial2.options.max) + myDial2.options.value;
		var ret = [dial1Value, dial2Value];
		
		var currentPlayerTime = Math.floor(player.getCurrentTime());
		
		if (dial2Value >= currentPlayerTime)
		{
			player.setCurrentTime(dial2Value); //need to set player before sync. player 'playing' loop constantly calls update dial with current player time
			SyncAndSetDial1(dial2Value);
		}
		else
		{
			lockSyncAndSetDial2(currentPlayerTime);
			setDialTimeNoChecks(myDial1, dial2Value);
		}

		if (!pausedOld)
			player.play();

		return ret;
	}
	
	jQuery('#createSnippet').click(function() {
		
		var timeRange = createSnippet();
		var str = convertFromSeconds(timeRange[0]) + " - " + convertFromSeconds(timeRange[1]);
		$('#SnippetText').val(str);

	});

	//namespaces
	//https://www.sitepoint.com/community/t/jquery-calling-function-from-other-script/8006/4
	var controls = null;
	var callbackSetA = null;
	var callbackSetB = null;
	
	function setupControlsNamespace() {
		controls = {
			refreshAllSlidersUI : function() {
				refreshAllSlidersUI();
			},
			loadedData : function() {
				var duration = player.getDuration();
				tempDuration = duration;
				
				slider.noUiSlider.updateOptions({
					start: [0, 0],
					range: {
						'min': 0,
						'max': Math.floor(duration)
					}
				});

				$("#controls").show();

				refreshAllSlidersUI();
				updateDials(duration);
				lockDial2();

			},
			onPlayTick : function(currentTime, _lastTime) {
				if (dial2Locked)
				{
					setDialTime(myDial2, Math.floor(currentTime), {force:true});
				}
				else
				{
					var cueTime = slider.noUiSlider.options.oldTo;
					if (cueTime >= _lastTime) {
					
						if (cueTime < currentTime) {
							if (!ignorePauseAtEndMarker) //avoids pausing when clicking 2nd range slider handle to jump to it's time (since it is the cueTime!)
							{
								player.pause();
								paused = true;
							}
							ignorePauseAtEndMarker = false;
						}
					}
				}
			},
			onSeeking : function() {
				ignorePauseAtEndMarker = settingTimeToRsMarker2;
			},
			onSeeked : function() {
				if (settingTimeToRsMarker2)
				{
					settingTimeToRsMarker2 = false;
				}
				else if (paused && dial2Locked)
				{
					setDialTime(myDial2, Math.floor(player.currentTime), {force:true});
				}
			},
			backupSliderTimes : function() {
				backedUpTimes = slider.noUiSlider.get();
			},
			restoreSliderTimes : function() {
				 slider.noUiSlider.set(backedUpTimes);
				 setDialTimes(+backedUpTimes[0], +backedUpTimes[1]);
			},
			createSnippet : function() {
				return createSnippet();
			},
			getTimeA : function() {
				return +slider.noUiSlider.get()[0];
			},
			getTimeB : function() {
				return +slider.noUiSlider.get()[1];
			},
			setTimes : function(timeA, timeB) {
				setDialTimes(timeA, timeB);
			},
			setCallbackSetA : function(f) {
				callbackSetA = f;
			},
			setCallbackSetB : function(f) {
				callbackSetB = f;
			},
		};
		
		window.controls = controls;
	}
	
	setupControlsNamespace();

} //InitControls