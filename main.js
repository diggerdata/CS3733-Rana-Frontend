var url = "https://wxasuozkgb.execute-api.us-east-2.amazonaws.com/dev/schedule/";
var sysurl = "https://wxasuozkgb.execute-api.us-east-2.amazonaws.com/dev/sysadmin";
// var scheduleid = 20;
// var secretcode = "nVOcXklPLV";
var scheduleid;
var meetTSID;
var secretcode = "";
var usertype = ""; //organizer
var maxRow; // gets the timeslots per day
var dayHours; // gets the hours in a day

var open = true; // determines if day or timeslot toggle is open or closed

// schedule week tracking
var week = 0;
var firstDate, lastDate, currWeek;

// hour offset
var hourOffset = (new Date()).getTimezoneOffset()/60;

function testFunction(){
  console.log("Test");
  var testDate = new Date();
  var a = fromLocalToISOFormat(testDate);
  var b = fromISOToLocalFormat(a);
  console.log(a);
  console.log(b);
  console.log(hourOffset);
}

// TODO:
/*
- Sys Admin delete schedules
- Sys admin report Activity
- Find time slots
*/

/*
	View Functions
*/

function getView(){
  // Depending on URL, gets the type of view - Create Schedule or Review Schedule
  var schedule_url = window.location.href;
  var n = schedule_url.indexOf(".html?");
  var createMode = document.getElementById("createMode");
  var reviewMode = document.getElementById("reviewMode");

  if (n < 0) { // create schedule view
    reviewMode.style.display = "none";
    createMode.style.display = "block";
  } else { // get schedule ID
    var index = n+6;
		scheduleid = schedule_url.substring(index);
		var isnum = /^\d+$/.test(scheduleid);
    if (scheduleid == "sysadmin"){
			document.getElementById("sysadminMode").style.display = "block";
		} else if (scheduleid == "" || !isnum) { // check ID existence
      alert("Can't view a schedule without a schedule ID!");
      window.location.href = "index.html";
    } else if (isnum) { // review schedule view
      createMode.style.display = "none";
      reviewMode.style.display = "block";
      getSchedule();
    }
  }
}

/*
	Create Schedule Functions
*/

function validateScheduleCreation() {
	// this is so ugly - needs refactoring

	// TODO better way to refactor obtaining all the elements in the Form?
	var schedulename = document.getElementById("scheduleName").value;
	var s_date = document.getElementById("startDate").value;
	var e_date = document.getElementById("endDate").value;
	var s_time = parseInt(document.getElementById("startTime").value);
	var s_time_type = document.getElementById("stType").value;
	var e_time = parseInt(document.getElementById("endTime").value);
	var e_time_type = document.getElementById("etType").value;
	var slotduration = document.getElementById("slotDuration").value;
	var username = document.getElementById("userName").value;
	var email = document.getElementById("userEmail").value;

  // Checks that dates are weekdays
  // TODO: Verification to check that dates chosen are weekdays

	// changes time to 24 hr time
	if (s_time_type == "PM" && s_time < 12) {
		s_time = parseInt(s_time) + 12;
	}

  if (e_time_type == "PM" && e_time < 12) {
		e_time = parseInt(e_time) + 12;
	}

	// date and time check
	if (e_date < s_date) {
		alert("End date can't be less than start date!");
		return false;
	}

  if (e_time <= s_time) {
		alert("Start time cannot be greater than or equal to the end time!");
		return false;
	}

	// creates javascript date format
	if (s_time < 10) {
		s_time = "0"+s_time;
	}

	if (e_time < 10) {
		e_time = "0"+e_time;
	}

	// Local Time
	var startDate = new Date(s_date+"T"+s_time+":00:00.00");
	var endDate = new Date(e_date+"T"+e_time+":00:00.00");

	// To UTC Time for Server
	// var utcStartDate = startDate.toISOString();
	// var utcEndDate = endDate.toISOString();
  var utcStartDate = fromLocalToISOFormat(startDate);
  var utcEndDate = fromLocalToISOFormat(endDate);

	var formData = new FormData();
	formData.append('name', schedulename);
	formData.append('start_date', utcStartDate);
	formData.append('end_date', utcEndDate);
	formData.append('duration', slotduration);
	formData.append('username', username);
	formData.append('email', email);
  formData.append('hours', (e_time - s_time));

	var object = {};
	for (const [key, value]  of formData.entries()) {
		object[key] = value;
		if (key == "duration" || key == "hours") {
			object[key] = parseInt(value);
		}
	}

	console.log(object);

	return createSchedule(object);

}

function createSchedule(obj) {
	var request = new XMLHttpRequest();
	request.responseType = "json";
	request.open("POST", url, true);
	request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

	request.onload = function(){
		if(this.response.status == "success"){
			secretcode = this.response.secret_code;
			scheduleid = this.response.schedule_id;
			console.log(this.response);
			alert("Schedule Successfully Created!\nSecret Code is: "+ secretcode);

      // doesn't refresh the page
      if (history.pushState){
        var newurl = window.location.origin + window.location.pathname + "?" + scheduleid;
        window.history.pushState({path:newurl}, '', newurl);
      }

      // changes the view to review
			toOrganizer();
			getView();
      // adds secret code to text field
      document.getElementById("o-secretcode").value = secretcode;
		}else{
			alert(this.response.message);
			return false;
		}
	};


	request.send(JSON.stringify(obj));

	return false;
}

/*
	Table Functions
*/

function getSchedule(){
	console.log("retrieving schedule...");

	var request = new XMLHttpRequest();
	var getWeekURL;
	if (currWeek != null){
		// getWeekURL = url+scheduleid+'?week='+currWeek.toISOString();
    getWeekURL = url+scheduleid+'?week='+fromLocalToISOFormat(currWeek);
	} else {
		getWeekURL = url+scheduleid; //+'?week='+currWeek.toISOString();
	}

  request.open('GET', getWeekURL, true);
	request.onload = function () {
		var data = JSON.parse(this.response);
		console.log(data);

		if (request.status >= 200 && request.status < 400) {

			// save organizer username
			// document.getElementById("organizer-username").innerHTML = "Organizer";// data.organizername
      document.getElementById("review-scheduleName").innerHTML = data.name;

			// get day of first time slot to determine where it gets placeholder
			// var startDay = (new Date(data.timeslots[0].start_date)).getDay(); // Mon = 1; Tue = 2; Wed = 3; Thur = 4; Fri = 5
			// var endDay = (new Date(data.timeslots[data.timeslots.length - 1].start_date)).getDay();
      var startDay = (fromISOToLocalFormat(data.timeslots[0].start_date)).getDay();
      var endDay = (fromISOToLocalFormat(data.timeslots[data.timeslots.length - 1].start_date)).getDay();

			// Gets the start date and end date to figure out how to show other weeks
			setScheduleWeekTracking(data.timeslots[0].start_date, data.end_date);

			var calendarBody = document.getElementById("schedulerTableBody");

      // Slot stuff
      var totalSlot = 0;
      var colSlot = 0;

			// Time slots per day
      var endtime;
      var starttime;

      // convert end time and start time
      if (data.end_time - hourOffset <= 0) {
        endtime = 24 - (hourOffset - data.end_time);
      } else {
        endtime = data.end_time - hourOffset
      }

      if (data.start_time - hourOffset <= 0) {
        starttime = 24 - (hourOffset - data.start_time);
      } else {
        starttime = data.start_time - hourOffset;
      }

			dayHours = endtime - starttime;
      console.log(dayHours);
			var timeSlotsInHour = data.duration/60;
			maxRow = dayHours/timeSlotsInHour;

			for (colNum = 0; colNum < 6; colNum++) {
				for (rowNum = 0; rowNum < maxRow; rowNum++) {
					if (colNum == 0){
						var row = calendarBody.insertRow(rowNum);
						var cell = row.insertCell(colNum);

						// var slotTime = new Date(data.timeslots[colSlot].start_date);
            var slotTime = fromISOToLocalFormat(data.timeslots[colSlot].start_date);

						if (slotTime.getMinutes() == 0) {
							cell.innerHTML = slotTime.getHours() +":"+ slotTime.getMinutes() +"0";
						} else {
							cell.innerHTML = slotTime.getHours() +":"+ slotTime.getMinutes();
						}

						colSlot++;
					} else {
						var cell = calendarBody.rows[rowNum].insertCell(colNum);

            // creates cells but they are empty if they do not exist
            if (colNum < startDay) {
              continue;
            }

            if (colNum > endDay) {
              continue;
            }


						if (usertype == "organizer" && data.timeslots[totalSlot].meeting != null){
							cell.className = "meetingSlot";
							cell.innerHTML = data.timeslots[totalSlot].meeting.username; // Change to username
						} else if (cell.className == "meetingSlot" && data.timeslots[totalSlot].meeting == null){
							cell.className = "openSlot";
							cell.innerHTML = "";
						} else if (data.timeslots[totalSlot].available){
              cell.className = "openSlot";
							cell.innerHTML = "";
            } else {
            	cell.className = "closedSlot";
							cell.innerHTML = "";
            }

            cell.id = data.timeslots[totalSlot].id;

						totalSlot++;
					}
				}
			}
			tableFunction();
		} else {
			alert("This schedule does not exist!");
			window.location.href = "index.html";
		}

	}

	request.addEventListener("loadend", loadEnd);

	request.send();
}

function refreshTable(){
  console.log("refreshing...");
  var request = new XMLHttpRequest();
  // var getWeekURL = url+scheduleid +'?week='+currWeek.toISOString();
  var getWeekURL = url+scheduleid +'?week='+fromLocalToISOFormat(currWeek);

  request.open('GET', getWeekURL, true);
	request.onload = function () {
		var data = JSON.parse(this.response);
		console.log(data);

		if (request.status >= 200 && request.status < 400) {
			var slot = 0;

	    // traverse all of table and match IDs
	    var calendarTable = document.getElementById("schedulerTable");
	    for (var j = 0; j < 6; j++){
	      for (var i = 0; i <= maxRow; i++){

					if (slot == data.timeslots.length){
						break;
					}

	        var cell = calendarTable.rows[i].cells[j];
	        if (cell.id != null && data.timeslots != null && cell.id == data.timeslots[slot].id) {
	          // Chance slot class depending on timeslot availability and type of user viewing schedule
						if (usertype == "organizer" && data.timeslots[slot].meeting != null) {
							cell.className = "meetingSlot";
							cell.innerHTML = data.timeslots[slot].meeting.username; // Change to username
						} else if (cell.className == "meetingSlot" && data.timeslots[slot].meeting == null){
							cell.className = "openSlot";
							cell.innerHTML = "";
							console.log("Meeting Canceled!")
						} else if (cell.className == "closedSlot" && data.timeslots[slot].available) {
	            cell.className = "openSlot";
							cell.innerHTML = "";
							console.log("Opened slot!");
	          } else if (cell.className == "openSlot" && !data.timeslots[slot].available){
	            cell.className = "closedSlot";
							cell.innerHTML = "";
							console.log("Closed slot!");
	          }

						slot++;
	        }

	      }
	    }
		}

	}

	request.send();
}

function rebuildSchedule(){
	// traverse through table and remove all id's and classes (if they have id's)

	console.log("rebuilding...");
  var request = new XMLHttpRequest();
  var getWeekURL = url+scheduleid +'?week='+fromLocalToISOFormat(currWeek);

  request.open('GET', getWeekURL, true);
	request.onload = function () {
		var data = JSON.parse(this.response);
		console.log(data);

		if (request.status >= 200 && request.status < 400) {
			// get day of first time slot to determine where it gets placeholder
	    // var startDay = (new Date(data.timeslots[0].start_date)).getDay(); // Mon = 1; Tue = 2; Wed = 3; Thur = 4; Fri = 5
	    // var endDay = (new Date(data.timeslots[data.timeslots.length - 1].start_date)).getDay();
      var startDay = (fromISOToLocalFormat(data.timeslots[0].start_date)).getDay();
      var endDay = (fromISOToLocalFormat(data.timeslots[data.timeslots.length - 1].start_date)).getDay();

			// traverse all of table and match IDs
	    var calendarTable = document.getElementById("schedulerTable");

      // Slot stuff
      var totalSlot = 0;

			for (var j = 0; j < 6; j++){
	      for (var i = 1; i <= maxRow; i++){
					if (j == 0){
						continue;
					} else {
						// var cell = calendarBody.rows[rowNum].insertCell(colNum);
						var cell = calendarTable.rows[i].cells[j];
						if (cell.id != null || cell.id != ""){
							//empty contents
							cell.id = "";
							cell.className = "";
							cell.innerHTML = "";
						}

            // empty if days do not exist on schedule
            if (j < startDay) {
              continue;
            }

            if (j > endDay) {
              continue;
            }

						if (usertype == "organizer" && data.timeslots[totalSlot].meeting != null){
							cell.className = "meetingSlot";
							cell.innerHTML = data.timeslots[totalSlot].meeting.username; // Change to username
						} else if (cell.className == "meetingSlot" && data.timeslots[totalSlot].meeting == null){
							cell.className = "openSlot";
							cell.innerHTML = "";
						} else if (data.timeslots[totalSlot].available){
              cell.className = "openSlot";
							cell.innerHTML = "";
            } else {
            	cell.className = "closedSlot";
							cell.innerHTML = "";
            }

            cell.id = data.timeslots[totalSlot].id;

						totalSlot++;
					}
				}
			}
			tableFunction();
		} else {
			alert("Error!");
		}

	}

	request.addEventListener("loadend", loadEnd);

	request.send();
}

function loadEnd(e) {
	var weekRange = document.getElementById("weekRange");
	weekRange.innerHTML = getWeekRange();
}

function meetingLoadEnd(e) {
  alert("Meeting Cancelled!");
  if (usertype == ""){
    window.location.reload();
  }
}

function tableFunction(){
  var calendarTable = document.getElementById("schedulerTable");
  var rIndex, cIndex;

	for (var j = 0; j < 6; j++){
		for (var i = 0; i <= maxRow; i++){
      calendarTable.rows[i].cells[j].onclick = function(){
				if (this.id != ""){
					selectSlot(this, this.id);
				} else {
					if (usertype == "organizer"){
						var time = this.innerText;
            console.log("time is", time);
						toggleTime(timeToDate(time));
					}
				}
      };

    }
  }
}

function selectSlot(cell, id){
  console.log("Slot selected: "+id);
	if (usertype == "organizer"){
		// Organizer
		if (id.length == 5 && id.substring(0, 4) == "head"){
			var num = parseInt(id.substring(4));
			if (num >= 0 && num <= 4) {
				var toggle_date = new Date();
				toggle_date.setFullYear(currWeek.getFullYear());
				toggle_date.setMonth(currWeek.getMonth());
				toggle_date.setDate(currWeek.getDate() + num);
				console.log("Date to toggle is", getWeekString(toggle_date));
        toggleDay(toggle_date);
			}
		} else if (cell.className == "meetingSlot"){
			if (confirm("Are you sure you want to cancel meeting?")){
				cancelMeeting(id);
				// cell.className = "openSlot";
			}
		} else if (cell.className == "openSlot"){
			console.log("O closing slot...");
			// cell.className = "closedSlot";
			toggleSlot(false, id);
		} else if (cell.className == "closedSlot"){
			console.log("O opening slot...");
			// cell.className = "openSlot";
			toggleSlot(true, id);
		}

	} else {
		// Participant
		var username = document.getElementById("username").value;
	  var email = document.getElementById("useremail").value;
		console.log(username, email);

		if (username != "" && email != "") {
			if (cell.className == "openSlot"){
				createMeeting(username, email, id);
			} else {
        alert("Can't make meetings on a closed slot!");
      }
		} else {
			alert("Please enter username and email to create a meeting");
		}

	}

}

/*
	Meeting Functions
*/

function createMeeting(username, email, id){
  var request = new XMLHttpRequest();
  var meeting_url = url + scheduleid + "/" + "timeslot/" + id;

	request.responseType = "json";
	request.open("POST", meeting_url, true);
	request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

	request.onload = function(){
    var data = this.response;
    console.log(data);
		if (request.status >= 200 && request.status < 400) {
			refreshTable();
			document.getElementById("p-secretcode").value = data.secret_code;
			getMeeting();
		}
	};

  var jsonObj = {username: username, email: email};

	request.send(JSON.stringify(jsonObj));
}

function getMeeting(){
	var pview = document.getElementById("participant-view");
	var psecretcode = document.getElementById("p-secretcode");
	var pusername = document.getElementById("participant-username");
	var pmeetingslot = document.getElementById("meeting-timeslot");

	console.log("getting meeting...");
  var request = new XMLHttpRequest();
  var meeting_url = url+scheduleid+"/meeting/"+psecretcode.value;
	console.log(meeting_url);

  request.open('GET', meeting_url, true);
	request.onload = function () {
		var data = JSON.parse(this.response);
		console.log(data);

		if (request.status >= 200 && request.status < 400) {
      secretcode = psecretcode.value;
      toParticipant();
			pview.style.display = "block";
			pusername.innerHTML = data.username;
      meetTSID = data.timeslot_id;
			// pmeetingslot.innerHTML = getMeetingString(new Date(data.start_date), data.duration);
      pmeetingslot.innerHTML = getMeetingString(fromISOToLocalFormat(data.start_date), data.duration);
		} else {
			alert("Incorrect Secret Code or \nMeeting no longer exists");
		}


	}

	request.send();

}

function cancelPMeeting(){
  console.log("CancelPMeeting", meetTSID);
  cancelMeeting(meetTSID);
}

function cancelMeeting(id){
	var request = new XMLHttpRequest();
  var meeting_url = url + scheduleid + "/" + "timeslot/" + id;

	request.responseType = "json";
	request.open("DELETE", meeting_url, true);
	request.setRequestHeader('Authorization', secretcode);
	request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

	request.onload = function(){
    var data = this.response;
    console.log(data);
    if (request.status >= 200 && request.status < 400) {
      refreshTable();
    } else {
      alert("Meeting does not exist!");
    }
	};

  request.addEventListener("loadend", meetingLoadEnd);

	request.send();
}

function getMeetingString(date, duration){
	var meetingdate = new Date(date);
	console.log(meetingdate);
	var first = meetingdate.toString().substring(0, 15);
	var second = meetingdate.toString().substring(16, 21);
	return " "+first+" at " + second + " for " + duration + " minutes";
}

/*
	Toggle Functions
*/

function toggleSlot(open, id){
	var request = new XMLHttpRequest();
	var toggle_url = url + scheduleid + "/" + "timeslot/" + id + "/";
	if (open){
		toggle_url = toggle_url + "open";
	} else {
		toggle_url = toggle_url + "close";
	}

	request.responseType = "json";
	request.open("POST", toggle_url, true);
  request.setRequestHeader('Authorization', secretcode);
	request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

	request.onload = function(){
    var data = this.response;
    console.log(data);
    refreshTable();
	};

	request.send();
}

function toggleDay(date){
	var request = new XMLHttpRequest();
	var toggle_url = url + scheduleid + "/" + "timeslot/";
  date.setHours(0);
  date.setMinutes(0);
	// console.log("date at", date.toISOString());
  console.log("date at", fromLocalToISOFormat(date));
	if (open){
		// toggle_url = toggle_url + "open?day=" + date.toISOString();
    toggle_url = toggle_url + "open?day=" + fromLocalToISOFormat(date);
	} else {
		// toggle_url = toggle_url + "close?day=" + date.toISOString();
    toggle_url = toggle_url + "close?day=" + fromLocalToISOFormat(date);
	}

	console.log("toggle day url: ", toggle_url);

	request.responseType = "json";
	request.open("POST", toggle_url, true);
  request.setRequestHeader('Authorization', secretcode);
	request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

	request.onload = function(){
    var data = this.response;
    console.log(data);
    refreshTable();
	};

	request.send();
}

function toggleTime(time){
  console.log(time);
  var request = new XMLHttpRequest();
	var toggle_url = url + scheduleid + "/" + "timeslot/";
	// console.log("date at", time.toISOString());
  console.log("date at", fromLocalToISOFormat(time));
	if (open){
		// toggle_url = toggle_url + "open?time=" + time.toISOString();
    toggle_url = toggle_url + "open?time=" + fromLocalToISOFormat(time);
	} else {
		// toggle_url = toggle_url + "close?time=" + time.toISOString();
    toggle_url = toggle_url + "close?time=" + fromLocalToISOFormat(time);
	}

	console.log("toggle time url: ", toggle_url);

	request.responseType = "json";
	request.open("POST", toggle_url, true);
  request.setRequestHeader('Authorization', secretcode);
	request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

	request.onload = function(){
    var data = this.response;
    console.log(data);
    refreshTable();
	};

	request.send();
}

function timeToDate(argTime){
	// converts a string HH:MM to a date object
	var timeslot = new Date();
	var hour = argTime.substring(0, argTime.indexOf(":"));
	var minute = argTime.substring(argTime.indexOf(":")+1);
	timeslot.setHours(hour);
	timeslot.setMinutes(minute);
	return timeslot;
}

function slotOptions(arg){
  var openButton = document.getElementById("openToggleButton");
  var closeButton = document.getElementById("closeToggleButton");
  if (arg){
    open = true;
    openButton.disabled = true;
    closeButton.disabled = false;
    console.log("open!");
  } else {
    open = false;
    openButton.disabled = false;
    closeButton.disabled = true;
    console.log("closed!");
  }
}

/*
	Week Functions
*/

function setScheduleWeekTracking(start, end){
  lastDate = fromISOToLocalFormat(end);
  lastDate.setHours(0,0,0,0);
  firstDate = fromISOToLocalFormat(start);
  firstDate.setHours(0,0,0,0);

  // Add placeholders for extend Dates
  // console.log(firstDate.toLocaleDateString());
  document.getElementById("extendStartDate").value = formatDate(firstDate);
  document.getElementById("extendEndDate").value = formatDate(lastDate);

  var a = new Date(start);
  if (a.getDay() > 1){
    a.setDate(a.getDate() - (a.getDay() - 1)); // 1 is Monday
  }

  currWeek = a;

}

function formatDate(date) {
    var month = '' + (date.getMonth() + 1),
        day = '' + date.getDate(),
        year = date.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

function previousWeek() {
  // TODO: implement previous week
  var previousWeek = currWeek;
  currWeek = getPreviousWeek(currWeek);
  if (previousWeek == currWeek) {
    console.log("Can't go to previous week!");
    return;
  }
  week--;
  rebuildSchedule();
  // if (week > 0) {
  //   currWeek = getPreviousWeek(currWeek);
  //   week--;
  //   rebuildSchedule();
  // } else {
  //   alert("Can't go before start date!");
  // }

}

function nextWeek() {
  // TODO: implement next week
  // TODO: check if end date is in next week (get correct 'end' date)
  var previousWeek = currWeek;
  currWeek = getNextWeek(currWeek);
  if (previousWeek == currWeek) {
    console.log("Can't go to next week!");
    return;
  }
  week++;
  rebuildSchedule();
  // week cannot increase if end date is in current week
}

function getNextWeek(date){
  var resultDate = new Date(date.getTime());
  resultDate.setDate(date.getDate() + 7);
  if (onLastWeek(date)){
    alert("Cannot go to a week that does not exist!");
    return date;
  }
  return resultDate;
}

function onLastWeek(date){
  // get lastDate and current week and compares
  // console.log("lastweek:", date.toLocaleDateString(), lastDate.toLocaleDateString());
  for (var num = 0; num < 5; num++){
    var newDate = new Date(date.getTime());
    newDate.setDate(date.getDate() + num);
    if (isSameDate(newDate, lastDate)){
      return true;
    }
  }
  return false;
}

function onFirstWeek(date){
  // gets firstdate and current week and compares
  for (var num = 0; num < 5; num++){
    var newDate = new Date(date.getTime());
    newDate.setDate(date.getDate() + num);
    if (isSameDate(newDate, firstDate)){
      return true;
    }
  }
  return false;
}

function isSameDate(date1, date2){
  // checks if both dates (month day year) are the same
  if (date1.getMonth() == date2.getMonth()
  && date1.getFullYear() == date2.getFullYear()
  && date1.getDate() == date2.getDate()) {
    return true;
  }
  return false;
}

function getPreviousWeek(date){
  var resultDate = new Date(date.getTime());
  resultDate.setDate(date.getDate() - 7);
  if (onFirstWeek(date)){
    alert("Cannot go to a week that does not exist!");
    return date;
  }
  return resultDate;
}

function getWeekRange(){
  // Example return " March 3, 2018 - March 9, 2018"
	if (currWeek != null){
		var lastDayOfWeek;
		lastDayOfWeek = new Date(currWeek.getTime());
		lastDayOfWeek.setDate(currWeek.getDate() + 4);
		return getWeekString(currWeek)+" - "+getWeekString(lastDayOfWeek);
	} else {
		return "";
	}

}

function getWeekString(date){
  // sketch soltion lol
  return date.toString().substring(4, 15);
}

/*
	Organizer Functions
*/

function authenticateOrganizer(){
  var osecretcode = document.getElementById("o-secretcode");
  console.log("Authenticating Organizer...");
  var request = new XMLHttpRequest();
  var auth_url = url+scheduleid+"/authenticate";
	console.log(auth_url);
  request.open('GET', auth_url, true);
	request.setRequestHeader('Authorization', osecretcode.value);
	request.onload = function () {
		var data = JSON.parse(this.response);
		console.log(data);

		if (request.status >= 200 && request.status < 400) {
      toOrganizer();
		} else {
			alert("Incorrect Secret Code!");
		}


	}

	request.send();
}

function toOrganizer(){
	usertype = "organizer";
	if (document.getElementById("reviewMode").style.display == "block"){
		secretcode = document.getElementById("o-secretcode").value;
		refreshTable();
	}
	// document.getElementById("o-secretcode").disabled = true;
  document.getElementById("meeting-legend").style.display = "block";
	document.getElementById("o-button").style.display = "none";
	document.getElementById("newP-page").style.display = "none";
	document.getElementById("returnP-page").style.display = "none";
	document.getElementById("organizer-view").style.display = "block";
}

function deleteSchedule() {
	var answer = confirm("Are you sure you want to delete this schedule?");
	if (answer) {
		// schedule is deleted and returns back to home page
    var request = new XMLHttpRequest();
    request.open('DELETE', url+scheduleid, true);
  	request.setRequestHeader('Authorization', secretcode);
    request.onload = function () {
  		var data = JSON.parse(this.response);
  		console.log(data);

      // TODO fix request to send 400 error if ID + authorization are incorrect
  		if (request.status >= 200 && request.status < 400) {
        alert("Schedule Deleted!");
        window.location.href = "index.html";
      }

  	}

  	request.send();
	} else {
		// nothing
	}
}

function validateExtendDates(){
  // validate whether the dates are actually extended...
  var startExtend = new Date(document.getElementById("extendStartDate").value);
	var endExtend = new Date(document.getElementById("extendEndDate").value);

  // change the time so its not affected in the change
  // console.log(startExtend, "||", endExtend);
  startExtend.setHours(startExtend.getHours() + hourOffset);
  endExtend.setHours(endExtend.getHours() + hourOffset);
  // console.log(startExtend, "||", endExtend);

  console.log(startExtend, "||", firstDate);
  if (startExtend < firstDate) {
    console.log("Extending Start date");
    firstDate = startExtend;
    // var a = extendDates(true, startExtend.toISOString());
    extendDates(true, fromLocalToISOFormat(startExtend));
  } else {
    if (startExtend > firstDate){
      alert("Start date should be extended!");
    }
  }

  console.log(endExtend, "||", lastDate);

  if (endExtend > lastDate) {
    console.log("Extending End date");
    lastDate = endExtend;
    // var b = extendDates(false, endExtend.toISOString());
    extendDates(false, fromLocalToISOFormat(endExtend));
  } else {
    if (endExtend < lastDate){
      alert("End date should be extended!");
    }

  }

  return false;

}

function extendDates(arg, new_date){
  console.log(arg, new_date);
  var obj = {"date": new_date, "hours": dayHours};
  var extend_url;
  if (arg) { // start
    extend_url = url + scheduleid + "/start";
  } else {
    extend_url = url + scheduleid + "/end";
  }

  var request = new XMLHttpRequest();
  request.responseType = "json";
  request.open("POST", extend_url, true);
  request.setRequestHeader('Authorization', secretcode);
  request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

  request.onload = function(){
    var data = this.response;
    console.log(data);
  };

  request.addEventListener("loadend", rebuildSchedule);
  request.send(JSON.stringify(obj));

  return false;
}


/*
	Search Time Slots
*/

function removeOptions(selectbox){
    var i;
    for(i = selectbox.options.length - 1 ; i >= 0 ; i--) {
        selectbox.remove(i);
    }
}

function getAvailableTimeslots() {
	document.getElementById("searchList").style.display = "block";
  // getAvailableTimeslots(year, month, weekday, day, hour)
  // get timeslots THIS IS WHERE I NEED YOU NATHAN!

  let dummyTimeSlotStrings = ["slot 1", "slot 2", "slot 3", "slot 2","slot 2","slot 2","slot 2"];

  // put them into the table
  var x = document.getElementById("timeSlotListOptions");
  if (x.style.display = "none") {
    x.style.display = "block";
  }
  removeOptions(x);
  const limitingLength = 12;
  let arrayLength = dummyTimeSlotStrings.length;
  x.size = (arrayLength <= limitingLength) ? arrayLength : limitingLength;
  for (i=0; i < dummyTimeSlotStrings.length; i++) {
    let option = document.createElement("option");
    option.text = dummyTimeSlotStrings[i];
    x.add(option);
  }

  // return array of timeslots
}

/*
	Participant Functions
*/

function toParticipant(){
	// document.getElementById("p-secretcode").disabled = true;
	document.getElementById("p-button").style.display = "none";
	document.getElementById("newP-page").style.display = "none";
	document.getElementById("returnP-page").style.display = "block";
	document.getElementById("organizer-page").style.display = "none";
}

/*
  Sys Admin Functions

  DELETE: /sysadmin?days=
  GET: /sysadmin?hours=

*/

function authenticateSysAdmin(){
  var sysasecretcode = document.getElementById("sysa-secretcode");
  console.log("Authenticating SysAdmin...");
  var request = new XMLHttpRequest();
  var sys_url = sysurl+"/authenticate";
	console.log(sys_url);
  request.open('GET', sys_url, true);
	request.setRequestHeader('Authorization', sysasecretcode.value);
	request.onload = function () {
		var data = JSON.parse(this.response);
		console.log(data);

		if (request.status >= 200 && request.status < 400) {
      toSysAdmin();
		} else {
			alert("Incorrect Secret Code!");
		}

	}

	request.send();
}

function toSysAdmin(){
  secretcode = document.getElementById("sysa-secretcode").value;
  document.getElementById("sysa-secretcode").disabled = true;
  document.getElementById("sysa-login").disabled = true;
  document.getElementById("deleteForm").style.visibility = "visible";
  document.getElementById("reportForm").style.visibility = "visible";
}

function deleteSchedules(){
  var daysOld = parseFloat(document.getElementById("daysOldSchedule").value);
  if (!Number.isInteger(daysOld) || daysOld < 0) {
    alert("Input must be a positive integer!");
    return;
  }

  console.log(" Deleting Schedules...");
  var request = new XMLHttpRequest();
  var sys_url = sysurl+"?days="+daysOld;
	console.log(sys_url);
  request.open('DELETE', sys_url, true);
	request.setRequestHeader('Authorization', secretcode);
	request.onload = function () {
		var data = JSON.parse(this.response);
		console.log(data);
    if (request.status >= 200 && request.status < 400) {
      var numDel = document.getElementById("numDeletedSchedules");
      if (data.num_deleted == 0){
        numDel.innerHTML = "There were no schedules to delete!";
      } else {
        numDel.innerHTML = data.num_deleted+" Schedules Deleted!";
      }
    } else {
			alert("Error!");
		}

	}

	request.send();


}

function reportActivity(){
  var hours = parseFloat(document.getElementById("hoursCreatedSchedule").value);
  if (!Number.isInteger(hours) || hours < 0) {
    alert("Input must be a positive integer!");
    return;
  }

  document.getElementById("scheduleList").style.display = "block";

  console.log("Report Activity...");
  var request = new XMLHttpRequest();
  var sys_url = sysurl+"?hours="+hours;
	console.log(sys_url);
  request.open('GET', sys_url, true);
	request.setRequestHeader('Authorization', secretcode);
	request.onload = function () {
		var data = JSON.parse(this.response);
		console.log(data);


		if (request.status >= 200 && request.status < 400) {
      var list = document.getElementById("scheduleListOptions");
      var reportText = document.getElementById("reportText");
      removeOptions(list);
      console.log(data.num_created);
      if (data.num_created == 0){
        list.style.display = "none";
        reportText.innerHTML = "No schedules created in the last "+hours+" hours";
        return;
      }

      if (list.style.display = "none") {
        list.style.display = "block";
      }


      reportText.innerHTML = "Created Date | Schedule Name - Organizer";

      var limitingLength = 12;
      list.size = (data.num_created <= limitingLength) ? data.num_created : limitingLength;
      for (i=0; i < data.num_created; i++) {
        var option = document.createElement("option");
        var created = (fromISOToLocalFormat(data.schedules[i].created)).toLocaleDateString();
        var name = data.schedules[i].name;
        var org = data.schedules[i].organizer;
        option.text = created+" | "+name+" - "+org;
        list.add(option);
      }
		} else {
			alert("Error!");
		}

	}

	request.send();
}

/*
  Date functions
*/

function fromLocalToISOFormat(date) {
  var transform_date = new Date(date.getTime());
  transform_date.setHours(transform_date.getHours()-hourOffset);
  return transform_date.toISOString();
}

function fromISOToLocalFormat(dateISO) {
  var transform_date = new Date(dateISO);
  transform_date.setHours(transform_date.getHours()+hourOffset);
  return transform_date;
}
