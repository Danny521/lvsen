package com.lvsen.modules.business.controller;

import com.lvsen.common.utils.R;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;

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