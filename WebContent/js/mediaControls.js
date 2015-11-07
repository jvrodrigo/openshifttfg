var container;
var canvas;
var ctx;
var videoControls;
var progressBar;
var chat;
var chatUI;
var chatList;
var card;
/* CARGA EL DOCUMENTO */
$(document).ready(function() {

	chat = $("#chat");
	videoControls = $("#videoControls");
	progressBar = $("#progressBar");
	chatUI = document.getElementById("chat");
	chatUI.style.opacity = 1;
	chatList = $('#chatList');
	chat.draggable();
	chat.resizable();
	videoControls.draggable();
	$('#chatList', chatList.mouseover(function(ev) {
		chat.draggable('disable');
		// console.log("disable");
	}).mouseleave(function(ev) {
		chat.draggable('enable');
		// console.log("enable");
	}));
	
	$("#progressBar", progressBar.mouseover(function(ev) {
		videoControls.draggable('disable');
		// console.log("disable");
	}).mouseleave(function(ev) {
		videoControls.draggable('enable');
		// console.log("enable");
	})), 
	container = document.getElementById("container");
	canvas = document.getElementById("canvasLocalVideo");
	ctx = canvas.getContext('2d');
	console.log(screen.width);
	console.log(screen.height);
	card = document.getElementById("card");  
	card.style.width = screen.width;
	card.style.height = screen.height + " px";
	//card.style.width;
	var localVideo = document.getElementById("localVideo");
	//localVideo.style.width = screen.width;
	
	//$("#card").width(screen.width);
	//console.log($("#card").width());
	
});
/* OPACIDAD Y FUNCIONES DEL CHAT */
var opacity = 1;
var paso = 0.2;
function upOpacity() {
	if (opacity < 1) {
		chatUI.style.opacity = (Math.round((opacity + paso) * 100) / 100);
		opacity = (Math.round((opacity + paso) * 100) / 100);
	}
	// console.log(opacity);
}
function downOpacity() {
	if (opacity > 0.2) {
		chatUI.style.opacity = (Math.round((opacity - paso) * 100) / 100);
		opacity = (Math.round((opacity - paso) * 100) / 100);
	}
	// console.log(opacity);
}
function closeChat() {
	chatUI.style.display = "none";
	document.getElementById("chatOn").style.display = "none";
	document.getElementById("chatOff").style.display = "block";
}
function openChat() {
	chatUI.style.display = "inherit";
	document.getElementById("chatOn").style.display = "block";
	document.getElementById("chatOff").style.display = "none";
}
/* HACER FOTO */
function takePicture() {
	if (localVideo != null) {

		var cw = Math.floor(localVideo.clientWidth);
		var ch = Math.floor(localVideo.clientHeight);
		canvas.width = cw;
		canvas.height = ch;
		ctx.drawImage(localVideo, 0, 0, cw, ch);
		// "image/webp" works in Chrome.
		// Other browsers will fall back to image/png.
		document.getElementById('snapShot').src = canvas.toDataURL('image/png');
	}
}
/* PANTALLA COMPLETA */
document.addEventListener("fullscreenchange", function() {
	if (document.fullscreen) {

	} else {
		document.getElementById("enterFullScreen").style.display = "block";
		document.getElementById("exitFullScreen").style.display = "none";
	}
	;
}, false);

document.addEventListener("mozfullscreenchange", function() {
	if (document.mozFullScreen) {

	} else {
		document.getElementById("enterFullScreen").style.display = "block";
		document.getElementById("exitFullScreen").style.display = "none";
	}
}, false);

document.addEventListener("webkitfullscreenchange", function() {
	if (document.webkitIsFullScreen) {

	} else {
		document.getElementById("enterFullScreen").style.display = "block";
		document.getElementById("exitFullScreen").style.display = "none";
	}
}, false);

document.addEventListener("msfullscreenchange", function() {
	if (document.msFullscreenElement) {

	} else {
		document.getElementById("enterFullScreen").style.display = "block";
		document.getElementById("exitFullScreen").style.display = "none";
	}
}, false);

function enterFullScreen() {
	console.log("Entrando en pantalla completa.");
	if (container.requestFullscreen) {
		container.requestFullscreen();
	} else if (container.mozRequestFullScreen) {
		container.mozRequestFullScreen();
	} else if (container.webkitRequestFullscreen) {
		container.webkitRequestFullscreen();
	} else if (container.msRequestFullscreen) {
		container.msRequestFullscreen();
	}
	document.getElementById("enterFullScreen").style.display = "none";
	document.getElementById("exitFullScreen").style.display = "block";
}
function exitFullScreen() {
	console.log("Saliendo de pantalla completa.");
	if (document.exitFullscreen) {
		document.exitFullscreen();
	} else if (document.mozCancelFullScreen) {
		document.mozCancelFullScreen();
	} else if (document.webkitExitFullscreen) {
		document.webkitExitFullscreen();
	} else if (document.msExitFullscreen) {
		document.msExitFullscreen();
	}
	document.getElementById("enterFullScreen").style.display = "block";
	document.getElementById("exitFullScreen").style.display = "none";
}
/* RELLAMADA */
function reCall() {
	location.reload();
}
/* MUTE Y UNMUTE AUDIO */
var isAudioMuted;
function toggleAudioMute() {
	if (localStream != null) {
		if (localStream.getAudioTracks().length === 0) {
			console.log("No local audio available.");
			return;
		}
		if (isAudioMuted) {
			var i;
			for (i = 0; i < localStream.getAudioTracks().length; i++) {
				localStream.getAudioTracks()[i].enabled = true;
				//console.log("Audio stream " + localStream.getAudioTracks()[i]);
			}
			if (remoteStream != null) {
				for (i = 0; i < remoteStream.getAudioTracks().length; i++) {
					remoteStream.getAudioTracks()[i].enabled = true;
					//console.log("Audio stream "	+ remoteStream.getAudioTracks()[i]);
				}
			}
			document.getElementById("mute").style.display = "block";
			document.getElementById("unMute").style.display = "none";
			console.log("Audio unmuted.");
		} else {
			for (i = 0; i < localStream.getAudioTracks().length; i++) {
				localStream.getAudioTracks()[i].enabled = false;
				//console.log("Local audio stream " + localStream.getAudioTracks()[i]);
			}
			if (remoteStream != null) {
				for (i = 0; i < remoteStream.getAudioTracks().length; i++) {
					remoteStream.getAudioTracks()[i].enabled = false;
					//console.log("Remote audio stream " + remoteStream.getAudioTracks()[i]);
				}
			}
			document.getElementById("mute").style.display = "none";
			document.getElementById("unMute").style.display = "block";
			console.log("Audio muted.");
		}
		isAudioMuted = !isAudioMuted;
	}
}
/* GRABACION DE VIDEO y AUDIO */
var recorder;
var mRecordRTC = new MRecordRTC();
mRecordRTC.mediaType = {
	audio : true,
	video : true
};
var isRecording = false;
function recordL() {
	if (started) {
		document.getElementById("record").style.display = "none";
		document.getElementById("stopRecord").style.display = "block";
		mRecordRTC.addStream(remoteStream);
		mRecordRTC.startRecording();
	} else if (localStream != null) {
		document.getElementById("record").style.display = "none";
		document.getElementById("stopRecord").style.display = "block";
		mRecordRTC.addStream(localStream);
		mRecordRTC.startRecording();
	}
};
var fileName = "record";
function stopRecordL() {
	document.getElementById("record").style.display = "block";
	document.getElementById("stopRecord").style.display = "none";
	mRecordRTC.stopRecording(function(url, type) {

		mRecordRTC.writeToDisk();
		mRecordRTC.save();

		var hyperlink = document.createElement('a');
		hyperlink.href = url;
		hyperlink.target = '_blank';
		hyperlink.download = "webrtc.webm";
		var node = document.createElement("div");
		node.className = "chatSend";
		var chatSendLateral = document.createElement("div");
		var chatSendLateralB = document.createElement("div");
		var chatSendMessage = document.createElement("div");
		chatSendLateral.className = "chatSendLateral";
		chatSendLateralB.className = "chatSendLateralB";
		chatSendMessage.className = "chatSendMessage";
		var message = document.createTextNode("Descargar Video");
		hyperlink.appendChild(message);
		chatSendMessage.appendChild(hyperlink);
		node.appendChild(chatSendLateral);
		node.appendChild(chatSendLateralB);
		node.appendChild(chatSendMessage);
		document.getElementById("chatList").appendChild(node);
		window.setInterval(function() {
			  var elem = document.getElementById('chatList');
			  elem.scrollTop = elem.scrollHeight;
		}, 1000);
	});
};

