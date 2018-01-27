package io.renren.modules.business.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.annotations.Api;

@RestController
@Api(tags = { "系统" })
@RequestMapping({ "/system" })
public class SystemController extends BaseController {


}