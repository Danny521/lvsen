package io.renren.modules.business.controller;

import javax.servlet.http.HttpServletRequest;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import io.renren.common.utils.R;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;

@RestController
@RequestMapping({ "/index" })
public class IndexController extends BaseController {

    @ApiOperation(value = "登录接口", httpMethod = "POST", notes = "用户登录系统的入口")
    @PostMapping({ "/login" })
    @ResponseBody
    public R login(HttpServletRequest request, @ApiParam(name = "acount", value = "帐号", required = true) String acount,
            @ApiParam(name = "password", value = "密码", required = true) String password) {

        return R.ok();
    }

    @ApiOperation(value = "注销接口", httpMethod = "GET", notes = "用户注销系统的入口")
    @GetMapping({ "/logout" })
    @ResponseBody
    public R logout(HttpServletRequest request, @ApiParam(name = "userId", value = "用户ID", required = true) Integer userId) {

        return R.ok();
    }
}