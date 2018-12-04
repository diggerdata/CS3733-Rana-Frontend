var schedule_url = window.location.href;
var post_url = "https://sqc1z962y5.execute-api.us-east-2.amazonaws.com/dev/schedule/"
var secretcode = "";
var scheduleid = "";

// TODO:  check if ID actually exists in database - GET request

function getView(){
  // Depending on URL, gets the type of view - Create Schedule or Review Schedule
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
    }
  }
}

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
	} else if (e_date == s_date && e_time <= s_time) {
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
			alert("Calendar Successfully Created!\nSecret Code is: "+this.response.secret_code);
			window.location.replace("review.html?"+scheduleid);
		}else{
			alert(this.response.message);
			return false;
		}
	};

	request.send(JSON.stringify(obj));

	return false;
}
