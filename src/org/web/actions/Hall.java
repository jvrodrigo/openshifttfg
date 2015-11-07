package org.web.actions;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Map.Entry;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.logging.Logger;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.web.model.User;
import org.webrtc.common.Helper;

/**
 * Clase Welcome almacena el nombre de usuario y un token
 */
public class Hall extends HttpServlet{
	/**
	 * 
	 */

	private static final long serialVersionUID = -5237726610817892384L;
	private static final Logger logger = Logger.getLogger(Hall.class
			.getName());
	private String message;
	private String userName;
	private User user;
	public static ConcurrentMap<String, User> userList = new ConcurrentHashMap<String, User>();

	// Función execute(), por defecto struts busca esta función si no se
	// especifica otra
	public void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {		
		System.out.println("Hola usuario " + req.getParameter("userName"));
		user = new User();
		user.setName(req.getParameter("userName"));
		user.setToken(Helper.generate_random(16));
		userList.put(user.getToken(), user);

		String userListLi = "";
		for (Entry<String, User> user : userList.entrySet()) {
			System.out.println("Usuarios conectados: Nombre -> "
					+ user.getValue().getName() + " | Token -> "
					+ user.getValue().getToken());
			if(!this.user.getToken().equals(user.getValue().getToken())){
				userListLi = userListLi + "<li title=\"Pulse para llamar al usuario\" class=\"users-list-li\" onclick=\"calling(this)\" " +
					"id=\"" + user.getValue().getToken() + "\">" +
					"<a href=\"webrtc/?r=" + user.getValue().getToken() + this.user.getToken() + "\">Usuario:" +
					user.getValue().getName() + 
					"</a></li>";
			}
			
		}
		
		String userListResp = "<ul id=\"userList\" class=\"users-list-ul\">" + userListLi + "</ul>";
		
		Map<String, String> template_values = new HashMap<String, String>();
		template_values.put("server_name", req.getServerName());
        template_values.put("server_port", req.getServerPort() +"");
        template_values.put("myName", user.getName());
        template_values.put("myToken", user.getToken());
        template_values.put("userList", userListResp);
        
        setUserList(userList);
        resp.setContentType("text/html");
        File file = new File(getServletContext().getRealPath("hall.jtpl"));
        resp.getWriter().println(Helper.generatePage(file, template_values));
		
		logger.info("Nuevo usuario conectado: " + user.getName() + " token "
				+ user.getToken());
		
	}

	/**
	 * @return the message
	 */
	public String getMessage() {
		return message;
	}

	/**
	 * @param message the message to set
	 */
	public void setMessage(String message) {
		this.message = message;
	}

	/**
	 * @return the userName
	 */
	public String getUserName() {
		return userName;
	}

	/**
	 * @param userName the userName to set
	 */
	public void setUserName(String userName) {
		this.userName = userName;
	}

	/**
	 * @return the user
	 */
	public User getUser() {
		return user;
	}

	/**
	 * @param user the user to set
	 */
	public void setUser(User user) {
		this.user = user;
	}

	/**
	 * @return the userList
	 */
	public static ConcurrentMap<String, User> getUserList() {
		return userList;
	}

	/**
	 * @param userList the userList to set
	 */
	public static void setUserList(ConcurrentMap<String, User> userList) {
		Hall.userList = userList;
	}
}