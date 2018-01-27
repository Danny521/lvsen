package io.renren.modules.business.controller;

import javax.servlet.http.HttpServletRequest;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;

@RestController
@Api(tags = { "公共" })
@RequestMapping({ "/common" })
public class CommonController extends BaseController {

    @ApiOperation(value="获取详细信息", httpMethod = "GET", notes="获取详细信息")
    @GetMapping({ "/info" })
    public String getInfo(HttpServletRequest request) {
    	//TODO
        return "";
    }
}