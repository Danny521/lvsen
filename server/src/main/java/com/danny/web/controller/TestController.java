package com.danny.web.controller;

import java.util.Random;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang3.RandomUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({ "/test" })
public class TestController extends BaseController {
    private static Logger logger = LoggerFactory.getLogger(TestController.class);

    @ResponseBody
    @GetMapping(path = "/login")
    public String greeting(HttpServletRequest request, HttpServletResponse response) {
        String ck = request.getHeader("cookie");
        logger.info("----old cookie=" + ck);
        String jessionString = "123456"+RandomUtils.nextInt(0, 100);
        logger.info("----new cookie=" + jessionString);
//        Cookie cookie = new Cookie("JSESSIONID", jessionString);
//        Cookie token = new Cookie("tokenId", jessionString);
//        cookie.setPath("/");
//        cookie.setMaxAge(-1);// 设置24小时生存期，当设置为负值时，则为浏览器进程Cookie(内存中保存)，关闭浏览器就失效。
//        response.addCookie(cookie);
//        response.addCookie(token);
        response.setHeader("tokenId", jessionString);
        return jessionString;
    }

    @ResponseBody
    @GetMapping(path = "/hello")
    public String hello(HttpServletRequest request) {
        String cookie = request.getHeader("cookie");
        String token = request.getHeader("tokenId");
//        request.getCookies()[0].getName();
        logger.info("----cookie=" + cookie);
        logger.info("----token=" + token);
        return cookie + request.getCookies();
    }
}