var post_url = "https://wxasuozkgb.execute-api.us-east-2.amazonaws.com/dev/schedule/"
var userType = ""; // organizer, participant, init
var secretcode = "";
var scheduleid = "";

// schedule week tracking
var week = 0;
var firstMonday, lastDate, currWeek;

// TODO:  check if ID actually exists in database - GET request

function getView(){
  // Depending on URL, gets the type of view - Create Schedule or Review Schedule
  var schedule_url = window.location.href;
  var n = schedule_url.indexOf(".html?");
  var createMode = document.getElementById("createMode");
  var reviewMode = document.getElementById("reviewMode");
  if (n < 0) {
    // create schedule view
    reviewMode.style.display = "none";
    createMode.style.display = "block";
  } else {
    // get schedule ID
    var index = n+6;
		scheduleid = schedule_url.substring(index);
    // check ID existence
    if (scheduleid == "") {
      alert("Can't view a schedule without a schedule ID!");
      window.location.href = "index.html";
    } else {
      // review schedule view
      createMode.style.display = "none";
      reviewMode.style.display = "block";
      getSchedule();
    }
  }
}

/*

Create Schedule JavaScript Functions

*/

function validateScheduleCreation() {
	// this is so ugly - needs refactoring

	// TODO better way to refactor obtaining all the elements in the Form?
	var schedulename = document.getElementById("scheduleName").value;
	var s_date = document.getElementById("startDate").value;
	var e_date = document.getElementById("endDate").value;
	var s_time = document.getElementById("startTime").value;
	var s_time_type = document.getElementById("stType").value;
	var e_time = document.getElementById("endTime").value;
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
	var utcStartDate = startDate.toISOString();
	var utcEndDate = endDate.toISOString();

	var formData = new FormData();
	formData.append('name', schedulename);
	formData.append('start_date', utcStartDate);
	formData.append('end_date', utcEndDate);
	formData.append('duration', slotduration);
	formData.append('username', username);
	formData.append('email', email);

	var object = {};
	for (const [key, value]  of formData.entries()) {
		object[key] = value;
		if (key == "duration") {
			object[key] = parseInt(value);
		}
	}

	return createSchedule(object);

}

function createSchedule(obj) {
	var request = new XMLHttpRequest();

	request.responseType = "json";
	request.open("POST", post_url, true);
	request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

	request.onload = function(){
		if(this.response.status == "success"){
			secretcode = this.response.secret_code;
			scheduleid = this.response.schedule_id;
			console.log(this.response);
			alert("Calendar Successfully Created!\nSecret Code is: "+ secretcode);

      // doesn't refresh the page
      if (history.pushState){
        var newurl = window.location.origin + window.location.pathname + "?" + scheduleid;
        window.history.pushState({path:newurl}, '', newurl);
      }

      // changes the view to review
      userType = "organizer";
      getView();
      validateUser();
      getSchedule();

      // adds secret code to text field
      document.getElementById("secretCode").value = secretcode;
		}else{
			alert(this.response.message);
			return false;
		}
	};

	request.send(JSON.stringify(obj));

	return false;
}

/*

Review Schedule JavaScript Functions

*/

function changeView(arg){
  if (arg){
    userType = "organizer";
  } else {
    userType = "participant";
    // getMeeting(document.getElementById("secretCode"));
  }
  validateUser();
}

function tableFunction(){
  // Table Script
  var table = document.getElementById("calendar");
  var rIndex, cIndex;

  // table rows

  for (var i = 0; i < table.rows.length; i++){
    // collumns
    for (var j = 0; j < table.rows[i].cells.length; j++){
      table.rows[i].cells[j].onclick = function(){
        rIndex = this.parentElement.rowIndex;
        cIndex = this.cellIndex;
        console.log(this.innerHTML);
        console.log("Row: " + rIndex + ", Cell: " + cIndex);
      };

    }
  }
}

function selectSlot(id){
  console.log("free slot selected: "+id);
  var username = document.forms["createMeetingForm"]["userName"].value;

  // TODO: Allow Organizer to make slots busy or free by clicking on the slot
  if (userType == "organizer"){
    return;
  }

  if (username != ""){
    alert("Meeting set for: "+username+" at timeslot id of: "+id);
    createMeeting(username, id);
  } else {
    alert("Must have a user name to set a meeting!");
  }
  // TODO: send data to calendar
}

// TODO Janky Back end for now
function createMeeting(username, id){
  var request = new XMLHttpRequest();
  var meeting_url = post_url + scheduleid + "/" + "timeslot/" + id;
  console.log(meeting_url);

	request.responseType = "json";
	request.open("POST", meeting_url, true);
	request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

	request.onload = function(){
    var data = JSON.parse(this.response);
    console.log(data);
	};

  var jsonObj = {username: username, email: "a@a.com"};

	request.send(JSON.stringify(jsonObj));

	return false;
}

// TODO How to even implement this??
function getMeeting(code){
  var request = new XMLHttpRequest();
  var meeting_url = post_url + scheduleid + "/" + "timeslot/";
  request.open('GET', meeting_url, true);
  request.setRequestHeader('Authorization', code);
  request.onload = function () {
		var data = JSON.parse(this.response);
		console.log(data);

    // Gets the start date and end date to figure out how to show other weeks

    // TODO fix request to send 400 error if ID + authorization are incorrect
		// if (request.status >= 200 && request.status < 400 && data.status != "fail") {
    //
    // } else {
    //   alert("This meeting does not exist!");
    // }

	}

	request.send();
}

function getSchedule(){
  var request = new XMLHttpRequest();
  request.open('GET', post_url+scheduleid, true);
  request.onload = function () {
		var data = JSON.parse(this.response);
		console.log(data);

    // Gets the start date and end date to figure out how to show other weeks
    setScheduleWeekTracking(data.timeslots[0].start_date, data.end_date);

    // TODO fix request to send 400 error if ID + authorization are incorrect
		if (request.status >= 200 && request.status < 400 && data.status != "fail") {
      var reviewView = document.getElementById("reviewView");
      reviewView.style.display = "block";
      var rScheduleName = document.getElementById("rScheduleName");
      rScheduleName.innerHTML = data.name;
      var showCal = document.getElementById("showCal");
      showCal.style.display = "block";
    } else {
      alert("This schedule does not exist!");
    }

	}

	request.send();
}

function setScheduleWeekTracking(start, end){
  lastDate = new Date(end);

  var a = new Date(start);
  if (a.getDay() > 1){
    a.setDate(a.getDate() - (a.getDay() - 1)); // 1 is Monday
  }

  firstMonday = currWeek = a;

}

function validateUser(){
  var secretcode = document.getElementById("secretCode").value;
  var participant = document.getElementById("participantView");
  var organizer = document.getElementById("organizerView");
  var inituser = document.getElementById("initView");
  if (userType == "participant") { // Edit Meeting
    userType = "participant";
    organizer.style.display = "none";
    inituser.style.display = "block";
    participant.style.display = "block";
  } else if (userType == "organizer"){ // Edit Schedule
    userType = "organizer";
    participant.style.display = "none";
    inituser.style.display = "none";
    organizer.style.display = "block";
  }

  document.getElementById("viewChooser").style.display = "none";

  return false;
}

function toggleCalendar(arg) {
	var calDiv = document.getElementById("calendarView");
	var weekBtn = document.getElementsByClassName("cal-btn");
	var showDiv = document.getElementById("showCal");
	var hideDiv = document.getElementById("hideCal");

	if (arg){
		if (document.getElementById("calendarBody").children.length <= 1) {
			showTimeSlots();
		}

		for (i = 0; i < weekBtn.length; i++) {
			weekBtn[i].style.display = 'block';
		}
		calDiv.style.display = "block";
		showDiv.style.display = "none";
		hideDiv.style.display = "block";
	} else {
		for (i = 0; i < weekBtn.length; i++) {
			weekBtn[i].style.display = 'none';
		}
		calDiv.style.display = "none";
		hideDiv.style.display = "none";
		showDiv.style.display = "block";
	}
	return false;

}

function showTimeSlots() {

  var weekRange = document.getElementById("weekRange");
  weekRange.innerHTML = "<b>Week: </b>"+getWeekRange();
	// Create new request
	var request = new XMLHttpRequest();

	// Make GET request
  var getWeekURL = post_url+scheduleid+'?week='+currWeek.toISOString();
  // console.log(getURL);
  // request.open('GET', 'https://sqc1z962y5.execute-api.us-east-2.amazonaws.com/dev/schedule/'+scheduleid, true);
  request.open('GET', getWeekURL, true);
	request.onload = function () {
		// Access JSON data
		var data = JSON.parse(this.response);
		console.log(data);

    // get day of first time slot to determine where it gets placeholder
    var startDay = (new Date(data.timeslots[0].start_date)).getDay(); // Mon = 1; Tue = 2; Wed = 3; Thur = 4; Fri = 5
    var endDay = (new Date(data.timeslots[data.timeslots.length - 1].start_date)).getDay();

		if (request.status >= 200 && request.status < 400) {

			var calenderBody = document.getElementById("calendarBody");

			// The first column will contain the date information
			// Then for each of the days in the week (Mon-Fri), add the TimeSlot's availability to a new cell in the table
			for (colNum = 0; colNum < 6; colNum++) {
				// In the first column, add the time
        // Calculate the maximum number of rows, based on the number of TimeSlots per day
        var dayHours = data.end_time - data.start_time;
        var timeSlotsInHour = data.duration/60;
        var maxRow = dayHours/timeSlotsInHour; // time slots per day

        // Keep track of the slots that have been used so far
        var slot = 0;

				if (colNum == 0) {

					// For each row in the table, fill in the timeslot data
					for (rowNum = 0; rowNum < maxRow; rowNum++) {
						// Create a new empty row in the table
						var row = calenderBody.insertRow(rowNum);

						// Create a new cell <td> element at the current row and column
						var cell = row.insertCell(colNum);

						// Set the cell's contents
						var slotTime = new Date(data.timeslots[slot].start_date);

						if (slotTime.getMinutes() == 0) {
							cell.innerHTML = slotTime.getHours() +":"+ slotTime.getMinutes() +"0";
						} else {
							cell.innerHTML = slotTime.getHours() +":"+ slotTime.getMinutes();
						}

						// Increment the current slot counter
						slot++;
					}
				} else {
					// For each row in the table, add the TimeSlots for the current column
					for (rowNum = 0; rowNum < maxRow; rowNum++) {
						// Create a new cell <td> element at the current row and column
						var cell = calendarBody.rows[rowNum].insertCell(colNum);

            // creates cells but they are empty if they do not exist
            if (colNum < startDay) {
              continue;
            }

            if (colNum > endDay) {
              continue;
            }

						// Set the cell's contents
            // TODO: Find a way to not show the innerHTML tag, but have it available to collect when selecting the cell
						// cell.innerHTML = data.timeslots[slot].id;

						// If the TimeSlot is available, show this. Otherwise, show "Unavailable"
						if (data.timeslots[slot].available) {
							cell.className = "availableSlot";
              var slotId = data.timeslots[slot].id;
              cell.innerHTML = "<input type='button' value='free' width='100%' class='slot-btn' id='"+slotId+"' onClick='selectSlot(this.id)'>";
						} else {
							cell.className = "unavailableSlot";
						}

						// Increment the current slot counter
						slot++;
					}
				}
			}
		} else {
			// Error handling
		}
    tableFunction();
	}

	request.send();
}

function previousWeek() {
  // TODO: implement previous week
  if (week > 0) {
    currWeek = getPreviousWeek(currWeek);
    week--;
    reloadCalendar();
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
  reloadCalendar();
  // week cannot increase if end date is in current week
}

function reloadCalendar(){
  var new_body = document.createElement("tbody");
  new_body.id = "calendarBody";
  var old_body = document.getElementById("calendarBody");
  old_body.parentNode.replaceChild(new_body, old_body);
  showTimeSlots();
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
    console.log("N: "+newDate+"\nL: "+lastDate);
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

function deleteSchedule() {
	var answer = confirm("Are you sure you want to delete this schedule?");
	if (answer) {
		// schedule is deleted and returns back to home page
    var request = new XMLHttpRequest();
    request.open('DELETE', post_url+scheduleid, true);
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
		return false;
	} else {
		// nothing
		return true;
	}
}

// function putTimeslotsIntoTable() {}

// returns: void -- removes options from a selection in html
function removeOptions(selectbox)
{
    var i;
    for(i = selectbox.options.length - 1 ; i >= 0 ; i--)
    {
        selectbox.remove(i);
    }
}

// built for case: user searches for available timeslots
// returns: void -- gets available slots and puts them into a viewable list
function getAvailableTimeslots() {

  // getAvailableTimeslots(year, month, weekday, day, hour)
  // get timeslots THIS IS WHERE I NEED YOU NATHAN!

  // I'm using this VVV until i can get real info from you!
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
  
  // celebrate

  // return array of timeslots
}

/*
  TODO Functions
*/

/*
  function toggleTimeSlot() {
    // Called from "select slot" with userType = "organizer"
    // If slot is selected, and timeslot is "free", then it closes it
    // If slot is selected, and timeslot is "closed", then it opens it
    // If cell is header (monday, tuesday, wednesday, thursday, friday)
    // it should open/close the whole column
    // If cell is timeslot, it open/close the whole row
  }

  function createMeeting(){
    // If a participant selects any slot that is available, they are provided a secret code
    // participant can either select a slot on the schedule or submit a slot on the select options table (must return timeslot ID value)
  }

  function getMeeting(){
    // If participant enters correct code, they retrieve their username and the timeslot in a string
    // "Hi <username>"
    // "You have an appointment on: Feb 14, 2019 at 8:15 P.M."
    // They are given the chance to cancel a meeting

    // If incorrect code then:
    // "Your code is incorrect or your meeting was cancelled by the organizer"
  }


  function cancelMeetingP(){
    // With correct code, participant can cancel the meeting they have set
  }

  function cancelMeetingO(){
  // with correct code, organizer can click on a slot with meeting and cancel it
  // slot becomes open? or closed?
}

  function extendDates(){
    // Given start and end dates that are "extended" from schedule start and end dates, extend the dates on the schedule
    // and refresh
  }

  function searchForTimeSlots(){
    // Given a set of requirements, gets a list of avaialble time slots and displays them
  }

*/

/*
  TODO implementations
*/

/*
  - In Organizer view, the "closed" time slots are differently colored than the "meeting" timeslots
    - "meeting" timeslots display the user name inside
  - In Participant view, both "closed" and "meeting" timeslots look the same with no information provided (grey)
  - Authenticate returning participant and organizer using secret code
*/

