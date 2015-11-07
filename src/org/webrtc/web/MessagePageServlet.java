package org.webrtc.web;

import java.io.IOException;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.web.socket.SignalingWebSocket;
import org.webrtc.common.Helper;
import org.webrtc.model.Room;

public class MessagePageServlet extends HttpServlet {

	private static final long serialVersionUID = 1L;
	private static final Logger logger = Logger.getLogger(MessagePageServlet.class.getName()); 
	
	public void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {		
		String message = Helper.get_string_from_stream(req.getInputStream());
		
		System.out.println("Se recibe el mensaje: " + message);
		Map<String, String> params = Helper.get_query_map(req.getQueryString());
		String room_key = params.get("r");
		
		Room room = Room.get_by_key_name(room_key);
		if(room!=null) {
			String user = params.get("u");
			System.out.println("Usuario " + user);
		    String other_user = room.get_other_user(user);
		    if(other_user!=null && !other_user.equals("")) {
		    	// special case the loopback scenario
		    	if(other_user.equals(user)) {
		            message = message.replace("\"offer\"", "\"answer\"");
		            message = message.replace("a=crypto:0 AES_CM_128_HMAC_SHA1_32", "a=xrypto:0 AES_CM_128_HMAC_SHA1_32");
		    	}
		    	if(SignalingWebSocket.sendPeer(Helper.make_token(room, other_user), message)){
		    		System.out.println("OK - Mensaje enviado al usuario " + other_user + " FIN");
		    		resp.setContentType("text/html");
		    		resp.setStatus(HttpServletResponse.SC_OK);
		    	}else{
		    		System.out.println("ERROR - Mensaje no enviado al usuario " + other_user + " FIN");
		    		resp.setContentType("text/html");
		    		resp.setStatus(HttpServletResponse.SC_EXPECTATION_FAILED);
		    	}
		    }
		}else {
			logger.log(Level.WARNING, "Habitacion desconocida " + room_key);
		}
	}
	public void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
		String message = Helper.get_string_from_stream(req.getInputStream());
		System.out.println("Mensaje recibido por GET: " + message);
	
	}
	 
}
