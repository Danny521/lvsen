package com.lvsen.modules.business.controller;

import io.swagger.annotations.Api;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Api(tags = { "系统" })
@RequestMapping({ "/system" })
public class SystemController extends BaseController {


}