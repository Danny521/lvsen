package com.danny.web.controller;

import javax.servlet.http.HttpServletRequest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.danny.commons.utils.SystemConfig;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;

@RestController
@Api(tags = { "公共" })
@RequestMapping({ "/common" })
public class CommonController extends BaseController {
    private static Logger logger = LoggerFactory.getLogger(CommonController.class);

    @ApiOperation(value="获取详细信息", httpMethod = "GET", notes="获取详细信息")
    @GetMapping({ "/info" })
    public String getInfo(HttpServletRequest request) {
    	//TODO
        return "";
    }
}