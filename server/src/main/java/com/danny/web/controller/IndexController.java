package com.danny.web.controller;

import javax.servlet.http.HttpServletRequest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.danny.commons.utils.ApiResponseInfo;

import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;

@RestController
@RequestMapping({ "/index" })
public class IndexController extends BaseController {
	private static Logger logger = LoggerFactory.getLogger(IndexController.class);

	@ApiOperation(value = "登录接口", httpMethod = "POST", notes = "用户登录系统的入口")
	@PostMapping({ "/login" })
	@ResponseBody
	public ApiResponseInfo login(HttpServletRequest request,
			@ApiParam(name = "acount", value = "帐号", required = true) String acount,
			@ApiParam(name = "password", value = "密码", required = true) String password) {
		ApiResponseInfo info = new ApiResponseInfo();
		info.setContent(200, "成功");

		return info;
	}

	@ApiOperation(value = "注销接口", httpMethod = "GET", notes = "用户注销系统的入口")
	@GetMapping({ "/logout" })
	@ResponseBody
	public ApiResponseInfo logout(HttpServletRequest request,
			@ApiParam(name = "userId", value = "用户ID", required = true) Integer userId) {
		ApiResponseInfo info = new ApiResponseInfo();
		info.setContent(200, "成功");

		return info;
	}
}