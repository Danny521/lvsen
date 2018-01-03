package com.danny.commons.utils;

import javax.servlet.http.HttpServletRequest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.alibaba.fastjson.JSON;
import com.danny.lvsen.pojo.User;

public class UserTools {
	private static Logger logger = LoggerFactory.getLogger(UserTools.class);

	public static User getUser(HttpServletRequest request) {
		Object userInfo = request.getSession().getAttribute(SessionKey.KEY_USER);
		if (userInfo != null) {
			String userInfoJson = userInfo.toString();
			logger.debug("sessionId:" + request.getSession().getId() + userInfoJson);
			return JSON.parseObject(userInfoJson, User.class);
		}
		return null;
	}

	public static Integer getUserId(HttpServletRequest request) {
		User user = getUser(request);
		if (user != null) {
			return getUser(request).getId().intValue();
		}
		return null;
	}

	public static void setUser(HttpServletRequest request, User User) {
		request.getSession().removeAttribute(SessionKey.KEY_PERMISSIONS);
		if (User != null) {
			String userInfo = JSON.toJSONString(User);
			logger.debug("sessionId" + request.getSession().getId() + userInfo);
			request.getSession().setAttribute(SessionKey.KEY_USER, userInfo);
		}
	}

	public static void delUser(HttpServletRequest request) {
		request.getSession().removeAttribute(SessionKey.KEY_USER);
		request.getSession().removeAttribute(SessionKey.KEY_PERMISSIONS);
		request.getSession().invalidate();
	}
}
