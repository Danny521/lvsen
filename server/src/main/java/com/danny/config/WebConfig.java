package com.danny.config;

import java.util.HashMap;
import java.util.Map;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.boot.web.servlet.ServletRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.DispatcherServlet;

import com.danny.web.filter.LoginFilter;

public class WebConfig {
	@Bean
	public ServletRegistrationBean dispatcherRegistration(DispatcherServlet dispatcherServlet) {
		ServletRegistrationBean registration = new ServletRegistrationBean(dispatcherServlet);
		registration.getUrlMappings().clear();
		registration.addUrlMappings("/");
		registration.setLoadOnStartup(1);
		registration.setName("myDispatcher");
		return registration;
	}

	@Bean
	public FilterRegistrationBean LoginFilter() {
		FilterRegistrationBean registration = new FilterRegistrationBean();
		registration.setFilter(new LoginFilter());
		registration.setEnabled(true);
		registration.addUrlPatterns("/*");
		registration.setName("login filter");
		Map<String, String> initParameters = new HashMap<>();
		initParameters.put("ENCODING", "UTF-8");
		initParameters.put("LOGIN_PATH", "/login");
		initParameters.put("FILTER_PATH", "login#logout#403#404#500#heart/beat");
		registration.setInitParameters(initParameters);
		return registration;
	}
}
