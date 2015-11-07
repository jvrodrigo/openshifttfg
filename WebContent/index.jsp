<%@ page language="java" contentType="text/html; charset=UTF-8"
	pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<link href="css/style.css" rel="stylesheet" type="text/css">
<title>Bienvenido a WEBRTC</title>
</head>
<body onload="acceptField()">
<div id="content">
<h1>Bienvenido a WEBRTC</h1>
<h2>Introduce un nombre de usuario para conectacte a la Sala Principal</h2>
	<form  action="hall" method="post" id="form-to-hall" >
	<label for="userName">Nombre de usuario</label>
		<input id="userName" onkeyup="acceptField()" name="userName" autofocus="autofocus"/>
		<input id="submit-button" type="submit" disabled="disabled"/>
	</form>
	<p id="alert-message">El nombre de usuario debe de tener más de 2 carácteres</p>
	</div>
</body>
<script type="text/javascript">
var userName = document.getElementById("userName");
function acceptField(){
	if(userName.value.length < 3){
		document.getElementById("alert-message").style.display = "block";
		document.getElementById("submit-button").disabled = true;
		document.getElementById('form-to-hall').style.border = "1px solid #F00";
	}else{
		document.getElementById("alert-message").style.display = "none";
		document.getElementById("submit-button").disabled = false;
		document.getElementById('form-to-hall').style.border = "1px solid #666";
	}
	
};
</script>
</html>
