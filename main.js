var post_url = "https://sqc1z962y5.execute-api.us-east-2.amazonaws.com/dev/schedule/"
var userType = ""; // organizer, participant, init
var secretcode = "";
var scheduleid = "";

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

	// changes time to 24 hr time
	if (s_time_type == "PM" && s_time < 12) {
		s_time = parseInt(s_time) + 12;
	} else if (e_time_type == "PM" && e_time < 12) {
		e_time = parseInt(e_time) + 12;
	}

	// date and time check
	if (e_date < s_date) {
		alert("End date can't be less than start date!");
		return false;
	} else if (e_time <= s_time) {
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
	formData.append('duration', parseInt(slotduration));
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
      getView();
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
  if (user == "organizer"){
    return;
  }

  if (username != ""){
    alert("Meeting set for: "+username+" at timeslot id of: "+id);
  } else {
    alert("Must have a user name to set a meeting!");
  }
  // TODO: send data to calendar
}

function getSchedule(){
  var request = new XMLHttpRequest();
  request.open('GET', 'https://sqc1z962y5.execute-api.us-east-2.amazonaws.com/dev/schedule/'+scheduleid, true);
	// request.open('GET', 'https://sqc1z962y5.execute-api.us-east-2.amazonaws.com/dev/schedule/2?week=2011-04-18T00:00:00.00Z', true);
	// request.setRequestHeader('Authorization', 'ywoAcCBGpM');
  request.onload = function () {
		var data = JSON.parse(this.response);
		console.log(data);

    // TODO fix request to send 400 error if ID + authorization are incorrect
		if (request.status >= 200 && request.status < 400 && data.status != "fail") {
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

function validateUser(){
  var secretcode = document.getElementById("secretCode").value;
  var participant = document.getElementById("participantView");
  var organizer = document.getElementById("organizerView");
  var inituser = document.getElementById("initView");
  if (secretcode == "participant") { // Edit Meeting
    user = "participant";
    organizer.style.display = "none";
    inituser.style.display = "block";
    participant.style.display = "block";
  } else if (secretcode == "organizer"){ // Edit Schedule
    user = "organizer";
    participant.style.display = "none";
    inituser.style.display = "none";
    organizer.style.display = "block";
  } else {
    user = "";
    alert("Incorrect Code");
  }
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
	// Create new request
	var request = new XMLHttpRequest();

	// Make GET request
  request.open('GET', 'https://sqc1z962y5.execute-api.us-east-2.amazonaws.com/dev/schedule/'+scheduleid, true);
	request.onload = function () {
		// Access JSON data
		var data = JSON.parse(this.response);
		console.log(data);

    // get day of first time slot to determine where it gets placeholder
    var startDay = (new Date(data.timeslots[0].start_date)).getDay(); // Mon = 1; Tue = 2; Wed = 3; Thur = 4; Fri = 5


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
					slot = 0;
				} else {
					// For each row in the table, add the TimeSlots for the current column
          console.log(colNum);
					for (rowNum = 0; rowNum < maxRow; rowNum++) {
						// Create a new cell <td> element at the current row and column
						var cell = calendarBody.rows[rowNum].insertCell(colNum);

            if (colNum < startDay) {
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
}

function nextWeek() {
  // TODO: implement next week
}

function deleteSchedule() {
	var answer = confirm("Are you sure you want to delete this schedule?");
	if (answer) {
		// schedule is deleted and returns back to home page
		window.location.href = "index.html";
		return false;
	} else {
		// nothing
		return true;
	}
}
