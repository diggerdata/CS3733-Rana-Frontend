var schedule_url = window.location.href;
var user = "";
// var schedulecode = "";
// var id = "";
//
// var secretcode = "";
// validatePage();

// function validatePage(){
// 	var n = schedule_url.indexOf(".html?");
// 	if (n < 0){
// 		alert("Need to have a secret code to review any schedule!");
// 		window.location.replace("schedule.html");
// 	} else {
// 		var index = n+6;
// 		schedulecode = schedule_url.substring(index, index+10);
// 		id = schedule_url.substring(index+10);
// 	}
// }


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
	request.open('GET', 'https://sqc1z962y5.execute-api.us-east-2.amazonaws.com/dev/schedule/2?week=2011-04-18T00:00:00.00Z', true);
	request.setRequestHeader('Authorization', 'ywoAcCBGpM');
  request.onload = function () {
		var data = JSON.parse(this.response);
		console.log(data);

    // TODO fix request to send 400 error if ID + authorization are incorrect
		if (request.status >= 200 && request.status < 400 && data.status != "fail") {
      var scheduleName = document.getElementById("scheduleName");
      scheduleName.innerText = data.name;
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

// console.log(schedule_url);
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
	request.open('GET', 'https://sqc1z962y5.execute-api.us-east-2.amazonaws.com/dev/schedule/2?week=2011-04-18T00:00:00.00Z', true);
	request.setRequestHeader('Authorization', 'ywoAcCBGpM');
	// console.log('https://sqc1z962y5.execute-api.us-east-2.amazonaws.com/dev/schedule/'+id);
	// request.open('GET', 'https://sqc1z962y5.execute-api.us-east-2.amazonaws.com/dev/schedule/'+id, true);
	// request.setRequestHeader('Authorization', schedulecode);
	// console.log('OPENED', request.status);
	request.onload = function () {
		// console.log('DONE', request.status);
		// Access JSON data
		var data = JSON.parse(this.response);
		console.log(data);

    // TODO: Hour Time is incorrect...
		if (request.status >= 200 && request.status < 400) {
			var calenderBody = document.getElementById("calendarBody");

			// The first column will contain the date information
			// Then for each of the days in the week (Mon-Fri), add the TimeSlot's availability to a new cell in the table
			for (colNum = 0; colNum < 6; colNum++) {
				// In the first column, add the time
				if (colNum == 0) {
					// Keep track of the slots that have been used so far
					var slot = 0;

					// Calculate the maximum number of rows, based on the number of TimeSlots per day
					var maxRow = data.timeslots.length / 5;

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
					for (rowNum = 0; rowNum < maxRow; rowNum++) {
						// Create a new cell <td> element at the current row and column
						var cell = calendarBody.rows[rowNum].insertCell(colNum);
            // var btn = document.createElement('timeSlotInput');
            // btn.type = "button";
            // btn.className = "timeslot-btn btn";
            // btn.value = data.timeslots[slot].id;
            // cell.appendChild(btn);
            // calendarBody.rows[rowNum].cells[colNum].appendChild(btn);

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
