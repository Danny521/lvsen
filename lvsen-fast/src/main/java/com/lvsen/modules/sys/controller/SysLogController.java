package com.lvsen.modules.sys.controller;

import com.lvsen.common.utils.PageUtils;
import com.lvsen.common.utils.Query;
import com.lvsen.common.utils.R;
import com.lvsen.modules.sys.entity.SysLogEntity;
import com.lvsen.modules.sys.service.SysLogService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.apache.shiro.authz.annotation.RequiresPermissions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.List;
import java.util.Map;


/**
 * 系统日志
 * 
 * @author zhangtao
 * @email ceozhangtao@qq.com
 * @date 2017-03-08 10:40:56
 */
@Api(tags = { "系统日志" })
@Controller
@RequestMapping("/sys/log")
public class SysLogController {
	@Autowired
	private SysLogService sysLogService;
	
	/**
	 * 列表
	 */
	@ApiOperation(value = "获取日志列表", httpMethod = "GET", notes = "获取日志列表")
	@ResponseBody
	@RequestMapping("/list")
	@RequiresPermissions("sys:log:list")
	public R list(@RequestParam Map<String, Object> params){
		//查询列表数据
		Query query = new Query(params);
		List<SysLogEntity> sysLogList = sysLogService.queryList(query);
		int total = sysLogService.queryTotal(query);
		
		PageUtils pageUtil = new PageUtils(sysLogList, total, query.getLimit(), query.getPage());
		return R.ok().putData(pageUtil);
	}
	
}
