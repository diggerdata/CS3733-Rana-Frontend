
function validateCode() {
	var x = document.forms["loginForm"]["secretCode"].value;
	var div = document.getElementById("sysadminAccess");
	div.style.display = 'none';
	if (x != "sysadmin") {
		alert("Incorrect Secret Code!");
		return false;
	} else if (div.style.display == 'none'){
		div.style.display = 'block';
		return false;
	}
}
