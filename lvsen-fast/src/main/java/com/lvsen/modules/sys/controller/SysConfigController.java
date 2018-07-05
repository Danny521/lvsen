package com.lvsen.modules.sys.controller;

import com.lvsen.common.utils.PageUtils;
import com.lvsen.common.utils.Query;
import com.lvsen.common.utils.R;
import com.lvsen.common.annotation.SysLog;
import com.lvsen.common.validator.ValidatorUtils;
import com.lvsen.modules.sys.entity.SysConfigEntity;
import com.lvsen.modules.sys.service.SysConfigService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.apache.shiro.authz.annotation.RequiresPermissions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * 系统参数信息
 * 
 * @author zhangtao
 * @email ceozhangtao@qq.com
 * @date 2016年12月4日 下午6:55:53
 */
@Api(tags = { "系统配置" })
@RestController
@RequestMapping("/sys/config")
public class SysConfigController extends AbstractController {
    @Autowired
    private SysConfigService sysConfigService;

    /**
     * 所有配置列表
     */
    @ApiOperation(value = "获取配置列表", httpMethod = "POST", notes = "获取配置列表")
    @RequestMapping("/list")
    @RequiresPermissions("sys:config:list")
    public R list(@RequestParam Map<String, Object> params) {
        // 查询列表数据
        Query query = new Query(params);
        List<SysConfigEntity> configList = sysConfigService.queryList(query);
        int total = sysConfigService.queryTotal(query);

        PageUtils pageUtil = new PageUtils(configList, total, query.getLimit(), query.getPage());

        return R.ok().putData(pageUtil);
    }

    /**
     * 配置信息
     */
    @ApiOperation(value = "获取配置详情", httpMethod = "GET", notes = "获取配置详情", response = SysConfigEntity.class)
    @RequestMapping("/info/{id}")
    @RequiresPermissions("sys:config:info")
    public R info(@PathVariable("id") Long id) {
        SysConfigEntity config = sysConfigService.queryObject(id);

        return R.ok().appendData("config", config);
    }

    /**
     * 保存配置
     */
    @ApiOperation(value = "保存配置", httpMethod = "POST", notes = "保存配置")
    @SysLog("保存配置")
    @RequestMapping("/save")
    @RequiresPermissions("sys:config:save")
    public R save(SysConfigEntity config) {
        ValidatorUtils.validateEntity(config);

        sysConfigService.save(config);

        return R.ok();
    }

    /**
     * 修改配置
     */
    @ApiOperation(value = "修改配置", httpMethod = "POST", notes = "修改配置")
    @SysLog("修改配置")
    @RequestMapping("/update")
    @RequiresPermissions("sys:config:update")
    public R update(SysConfigEntity config) {
        ValidatorUtils.validateEntity(config);

        sysConfigService.update(config);

        return R.ok();
    }

    /**
     * 删除配置
     */
    @ApiOperation(value = "删除配置", httpMethod = "GET", notes = "删除配置")
    @SysLog("删除配置")
    @RequestMapping("/delete")
    @RequiresPermissions("sys:config:delete")
    public R delete(Long[] ids) {
        sysConfigService.deleteBatch(ids);

        return R.ok();
    }

}
