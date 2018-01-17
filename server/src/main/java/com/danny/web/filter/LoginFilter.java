package com.danny.web.filter;

import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.danny.commons.utils.SessionKey;
import com.danny.commons.utils.WebUtils;

public class LoginFilter implements Filter {

    private static final String ENCODING = "ENCODING";  //转码名称
    private static final String LOGIN_PATH = "LOGIN_PATH";  //登录路径
    private static final String FILTER_PATH = "FILTER_PATH";  //需要过滤掉的路径集合已#分隔

    private String encoding; //转码名称
    private String loginPath; //登录路径
    private String[] allowUrls; //允许的路径

    public void init(FilterConfig config) throws ServletException {

        encoding = config.getInitParameter(ENCODING);

        loginPath = config.getInitParameter(LOGIN_PATH);
        if (loginPath == null || loginPath.equals("") || loginPath.equals("null")) {
            loginPath = "/login";
        }

        //登录跳转路径
        loginPath = WebUtils.getApplicationContext() + loginPath;

        String filterPath = config.getInitParameter(FILTER_PATH);
        if (filterPath != null) {
            allowUrls = filterPath.contains("#") ? filterPath.split("#") : new String[]{filterPath};
        }

    }

    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        httpRequest.setCharacterEncoding(encoding);
        httpResponse.setCharacterEncoding(encoding);

        //判断需要过滤的路径
        if (null != allowUrls && allowUrls.length > 0) {
            String requestUrl = httpRequest.getRequestURI().replace(httpRequest.getContextPath(), "");
            for (String url : allowUrls) {
                if (requestUrl.contains(url)) {
                    chain.doFilter(request, response);
                    return;
                }
            }
        }

        //如果不是需要过滤的页面，则需先判断用户是否已登录
        Object user = httpRequest.getSession().getAttribute(SessionKey.KEY_USER);
        if (user != null) {//如果不为空,则进行已登录处理
            chain.doFilter(request, response);
            //如果请求头 [PVA-Auth]
        } else if (httpRequest.getHeader("PVA-Auth") != null && httpRequest.getHeader("PVA-Auth").equalsIgnoreCase("false")) {
            chain.doFilter(request, response);
            //如果是ajax请求响应头 [X-Requested-With]
        } else if (httpRequest.getHeader("X-Requested-With") != null &&
                httpRequest.getHeader("X-Requested-With").equalsIgnoreCase("XMLHttpRequest")) {
            httpResponse.setHeader("Session-Status", "Session-Out");   //在响应头设置session状态
            httpResponse.setHeader("Redirect-Url", loginPath);   //在响应头设置跳转URL
            httpResponse.setContentType("application/json;charset=UTF-8");
            String strJsonFormat = "{\"code\":%d,\"data\":{\"url\": \"%s\"}}";
            PrintWriter out = httpResponse.getWriter();
            out.println(String.format(strJsonFormat, 200, loginPath));
        } else {
            httpResponse.setContentType("text/html"); //如果为空,则进行未登录处理
            httpResponse.sendRedirect(loginPath); // 未登录跳转到登录页面
        }
    }

    public void destroy() {
    }
}
