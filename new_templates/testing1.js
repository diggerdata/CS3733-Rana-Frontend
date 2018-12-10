var url = "https://wxasuozkgb.execute-api.us-east-2.amazonaws.com/dev/schedule/";
// var scheduleid = 20;
// var secretcode = "nVOcXklPLV";
var scheduleid = 25;
var secretcode = "mrFNZxXIPF";
var usertype = ""; //organizer
var maxRow; // gets the timeslots per day

// schedule week tracking
var week = 0;
var firstDate, lastDate, currWeek;

// TODO:
/*
	1. ToggleDay - Accessed through selectSlot(cell, id)
		-> need to figure out when to decide to toggle open or close
	2. Merge create schedule with this
*/

/*
	Table Functions
*/

function getSchedule(){
	console.log("retrieving schedule...");

	var request = new XMLHttpRequest();
	var getWeekURL;
	if (currWeek != null){
		getWeekURL = url+scheduleid+'?week='+currWeek.toISOString();
	} else {
		getWeekURL = url+scheduleid; //+'?week='+currWeek.toISOString();
	}

  request.open('GET', getWeekURL, true);
	request.onload = function () {
		var data = JSON.parse(this.response);
		console.log(data);

		// save organizer username
		document.getElementById("organizer-username").innerHTML = "Organizer";// data.organizername

    // get day of first time slot to determine where it gets placeholder
    var startDay = (new Date(data.timeslots[0].start_date)).getDay(); // Mon = 1; Tue = 2; Wed = 3; Thur = 4; Fri = 5
    var endDay = (new Date(data.timeslots[data.timeslots.length - 1].start_date)).getDay();

		// Gets the start date and end date to figure out how to show other weeks
    setScheduleWeekTracking(data.timeslots[0].start_date, data.end_date);

		if (request.status >= 200 && request.status < 400) {

			var calendarBody = document.getElementById("schedulerTableBody");

      // Slot stuff
      var totalSlot = 0;
      var colSlot = 0;

			// Time slots per day
			var dayHours = data.end_time - data.start_time;
			var timeSlotsInHour = data.duration/60;
			maxRow = dayHours/timeSlotsInHour;

			for (colNum = 0; colNum < 6; colNum++) {
				for (rowNum = 0; rowNum < maxRow; rowNum++) {
					if (colNum == 0){
						var row = calendarBody.insertRow(rowNum);
						var cell = row.insertCell(colNum);

						var slotTime = new Date(data.timeslots[colSlot].start_date);

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
		} else {
			alert("Error!");
		}
		tableFunction();
	}

	request.addEventListener("loadend", loadEnd);

	request.send();
}

function refreshTable(){
  console.log("refreshing...");
  var request = new XMLHttpRequest();
  var getWeekURL = url+scheduleid +'?week='+currWeek.toISOString();

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
  var getWeekURL = url+scheduleid +'?week='+currWeek.toISOString();

  request.open('GET', getWeekURL, true);
	request.onload = function () {
		var data = JSON.parse(this.response);
		console.log(data);

    // get day of first time slot to determine where it gets placeholder
    var startDay = (new Date(data.timeslots[0].start_date)).getDay(); // Mon = 1; Tue = 2; Wed = 3; Thur = 4; Fri = 5
    var endDay = (new Date(data.timeslots[data.timeslots.length - 1].start_date)).getDay();

		if (request.status >= 200 && request.status < 400) {
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
		} else {
			alert("Error!");
		}
		tableFunction();
	}

	request.addEventListener("loadend", loadEnd);

	request.send();
}

function loadEnd(e) {
	var weekRange = document.getElementById("weekRange");
	weekRange.innerHTML = getWeekRange();
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

				// if () {
				// 	toggleDay(toggle_date, false);
				// } else if (){
				// 	toggleDay(toggle_date, true);
				// }
				// toggleDay();
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
    refreshTable();
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
			pview.style.display = "block";
			pusername.innerHTML = data.username;
			pmeetingslot.innerHTML = getMeetingString("2018-03-02", 15);
		} else {
			alert("error!");
		}


	}

	request.send();

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
    refreshTable();
	};

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

function toggleDay(date, open){
	var request = new XMLHttpRequest();
	var toggle_url = url + scheduleid + "/" + "timeslot/";
	console.log("date at", date.toISOString())
	if (open){
		toggle_url = toggle_url + "open?day=" + date.toISOString();
	} else {
		toggle_url = toggle_url + "close?day=" + date.toISOString();
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

/*
	Week Functions
*/

function setScheduleWeekTracking(start, end){
  lastDate = new Date(end);
  firstDate = new Date(start);

  var a = new Date(start);
  if (a.getDay() > 1){
    a.setDate(a.getDate() - (a.getDay() - 1)); // 1 is Monday
  }

  currWeek = a;

}

function previousWeek() {
  // TODO: implement previous week
  if (week > 0) {
    currWeek = getPreviousWeek(currWeek);
    week--;
    rebuildSchedule();
  } else {
    alert("Can't go before start date!");
  }

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
    alert("Cannot go to a further week that does not exist!");
    return date;
  }
  return resultDate;
}

function onLastWeek(date){
  // get lastDate and current week and compares
  for (var num = 0; num < 5; num++){
    var newDate = new Date(date.getTime());
    newDate.setDate(date.getDate() + num);
    if (isSameDate(newDate, lastDate)){
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
  return resultDate;
}

function getWeekRange(){
  // Example return " March 3, 2018 - March 9, 2018"
  var lastDayOfWeek;
  lastDayOfWeek = new Date(currWeek.getTime());
  lastDayOfWeek.setDate(currWeek.getDate() + 4);
  return getWeekString(currWeek)+" - "+getWeekString(lastDayOfWeek);
}

function getWeekString(date){
  // sketch soltion lol
  return date.toString().substring(4, 15);
}

/*
	Organizer Functions
*/

function toOrganizer(){
	usertype = "organizer";
	secretcode = document.getElementById("o-secretcode").value;
	refreshTable();
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
        window.location.assign("https://www.google.com")
      }

  	}

  	request.send();
	} else {
		// nothing
	}
}

/*
	Search Time Slots
*/

function removeOptions(selectbox){
    var i;
    for(i = selectbox.options.length - 1 ; i >= 0 ; i--)
    {
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
  for(i=0; i < dummyTimeSlotStrings.length; i++) {
    let option = document.createElement("option");
    option.text = dummyTimeSlotStrings[i];
    x.add(option);
  }

  // return array of timeslots
}
