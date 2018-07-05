package com.lvsen.modules.business.controller;

import org.apache.commons.lang3.RandomUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

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
        Cookie token = new Cookie("tokenId", jessionString);
        token.setPath("/");
        token.setMaxAge(-1);// 设置24小时生存期，当设置为负值时，则为浏览器进程Cookie(内存中保存)，关闭浏览器就失效。
        response.addCookie(token);
        return jessionString;
    }

    @ResponseBody
    @GetMapping(path = "/hello")
    public String hello(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        String tokenId = null;
        if(cookies.length > 0){
            for (Cookie cookie : cookies) {
                if("tokenId".equals(cookie.getName())){
                    tokenId = cookie.getValue();
                }
            }
        }
        return tokenId;
    }
}