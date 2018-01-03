package com.danny.web.controller;

import javax.servlet.http.HttpServletRequest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.danny.commons.utils.SystemConfig;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiImplicitParam;
import io.swagger.annotations.ApiOperation;

@RestController
@Api(tags = { "公共" })
@RequestMapping({ "/common" })
public class CommonController {
    private static Logger logger = LoggerFactory.getLogger(CommonController.class);

    @ApiOperation(value="获取用户详细信息", notes="根据url的id来获取用户详细信息")
	@ApiImplicitParam(name = "id", value = "用户ID", required = true, dataType = "Integer", paramType = "path")
    @RequestMapping({ "/user_info" })
    public String greeting(HttpServletRequest request) {
        String cookie = request.getHeader("cookie");
        String referer = request.getHeader("referer");
        logger.info("----cookie=" + cookie);
        logger.info("----referer=" + referer);
//        logger.info("------------url=" + AiermuHttpUrlUtil.makeGetUserInfoUrl());
//        String userInfo = HttpClientUtil.doGet4Https(AiermuHttpUrlUtil.makeGetUserInfoUrl(), cookie, referer);
//        logger.info("------------userInfo=" + userInfo);
        return SystemConfig.getString("redis.ip");
    }
}