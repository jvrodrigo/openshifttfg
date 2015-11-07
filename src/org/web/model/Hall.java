package org.web.model;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.logging.Logger;

public class Hall {
	private static final ConcurrentMap<String, User> BBDD = new ConcurrentHashMap<String, User>();
	private static final Logger logger = Logger.getLogger(User.class.getName());
	
	public void put(User user) {
		logger.info("Guardando el usuario: "+ user.getName() +") en la BBDD.");
		BBDD.put(user.getToken(),user);
	}
	
	/** Delete/Remove current {@link Room} instance from database */
	public void delete(User user) {
		logger.info("Eliminando el usuario: "+ user.getName() +" de la BBDD.");
		if(user!=null) {
			BBDD.remove(user);
			user = null;
		}
	}
	public User getUser(User user){
		return BBDD.get(user);
	}
}
