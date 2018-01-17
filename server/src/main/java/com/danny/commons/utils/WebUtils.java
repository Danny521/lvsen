package com.danny.commons.utils;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

public class WebUtils {

    private static String applicationContext;

    private WebUtils() {
    }

    /**
     * 返回当前服务应用的Root context
     * @return
     */
    public static String getApplicationContext() {
        return applicationContext;
    }

    public static void setApplicationContext(String context) {
        applicationContext = context;
    }

    /**
     * 添加导出Word文件的相应头文件信息
     *
     * @param response
     * @param name
     * @throws java.io.UnsupportedEncodingException
     */
    public static void addResponseHeaders(HttpServletResponse response, String name) throws UnsupportedEncodingException {
        response.setContentType("application/msword;charset=UTF-8");
        response.setHeader("Content-Disposition", "attachment;filename=\"" + URLEncoder.encode(name, "UTF-8") + ".doc" + "\"");
    }

    /**
     * 使用RestTemplate 发送一个post请求
     * 
     * @param restTemplate
     *            Spring RestTemplate
     * @param url
     *            发送请求目的地址
     * @param vars
     *            post请求所需要的参数
     * @return
     */
    public static ApiResponseInfo post(RestTemplate restTemplate, String url, MultiValueMap<String, ?> vars) {
        return restTemplate.postForObject(url, vars, ApiResponseInfo.class);
    }

    public static <T> T get(RestTemplate restTemplate, String url, Map<String, ?> vars, Class<T> clazz) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        ResponseEntity<T> response = restTemplate.getForEntity(url, clazz, vars);

        return response.getBody();
    }

    public static String getRealIpAddr(HttpServletRequest request) {
        String ip = request.getHeader("X-real-ip");// 先从nginx自定义配置获取
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("x-forwarded-for");
        }
        if (ip != null && ip.length() != 0 && !"unknown".equalsIgnoreCase(ip)) {
            // 多次反向代理后会有多个ip值，第一个ip才是真实ip
            if (ip.indexOf(",") != -1) {
                ip = ip.split(",")[0];
            }
        }
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("HTTP_CLIENT_IP");
        }
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("HTTP_X_FORWARDED_FOR");
        }
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        System.out.println("获取客户端ip: " + ip);
        return ip;
    }
}
