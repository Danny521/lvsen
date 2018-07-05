package com.lvsen.modules.sys.controller;

import com.lvsen.common.utils.Constant;
import com.lvsen.common.utils.PageUtils;
import com.lvsen.common.utils.Query;
import com.lvsen.common.utils.R;
import com.lvsen.common.annotation.SysLog;
import com.lvsen.common.validator.ValidatorUtils;
import com.lvsen.modules.sys.entity.SysRoleEntity;
import com.lvsen.modules.sys.service.SysRoleMenuService;
import com.lvsen.modules.sys.service.SysRoleService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.apache.shiro.authz.annotation.RequiresPermissions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 角色管理
 * 
 * @author zhangtao
 * @email ceozhangtao@qq.com
 * @date 2016年11月8日 下午2:18:33
 */
@Api(tags = { "角色管理" })
@RestController
@RequestMapping("/sys/role")
public class SysRoleController extends AbstractController {
    @Autowired
    private SysRoleService sysRoleService;
    @Autowired
    private SysRoleMenuService sysRoleMenuService;

    /**
     * 角色列表
     */
    @ApiOperation(value = "查询角色列表", httpMethod = "POST", notes = "查询角色列表")
    @RequestMapping("/list")
    @RequiresPermissions("sys:role:list")
    public R list(@RequestParam Map<String, Object> params) {
        // 如果不是超级管理员，则只查询自己创建的角色列表
        if (getUserId() != Constant.SUPER_ADMIN) {
            params.put("createUserId", getUserId());
        }

        // 查询列表数据
        Query query = new Query(params);
        List<SysRoleEntity> list = sysRoleService.queryList(query);
        int total = sysRoleService.queryTotal(query);
        PageUtils pageUtil = new PageUtils(list, total, query.getLimit(), query.getPage());
        return R.ok().putData(pageUtil);
    }

    /**
     * 角色列表
     */
    @ApiOperation(value = "获取所有角色列表", httpMethod = "GET", notes = "获取所有角色列表")
    @RequestMapping("/select")
    @RequiresPermissions("sys:role:select")
    public R select() {
        Map<String, Object> map = new HashMap<>();

        // 如果不是超级管理员，则只查询自己所拥有的角色列表
        if (getUserId() != Constant.SUPER_ADMIN) {
            map.put("createUserId", getUserId());
        }
        List<SysRoleEntity> list = sysRoleService.queryList(map);

        return R.ok().putList(list);
    }

    /**
     * 角色信息
     */
    @ApiOperation(value = "获取角色信息", httpMethod = "GET", notes = "获取角色信息", response = SysRoleEntity.class)
    @RequestMapping("/info/{roleId}")
    @RequiresPermissions("sys:role:info")
    public R info(@PathVariable("roleId") Long roleId) {
        SysRoleEntity role = sysRoleService.queryObject(roleId);

        // 查询角色对应的菜单
        List<Long> menuIdList = sysRoleMenuService.queryMenuIdList(roleId);
        role.setMenuIdList(menuIdList);

        return R.ok().appendData("role", role);
    }

    /**
     * 保存角色
     */
    @ApiOperation(value = "保存角色", httpMethod = "POST", notes = "保存角色")
    @SysLog("保存角色")
    @RequestMapping("/save")
    @RequiresPermissions("sys:role:save")
    public R save( SysRoleEntity role) {
        ValidatorUtils.validateEntity(role);

        role.setCreateUserId(getUserId());
        sysRoleService.save(role);

        return R.ok();
    }

    /**
     * 修改角色
     */
    @ApiOperation(value = "修改角色", httpMethod = "POST", notes = "修改角色")
    @SysLog("修改角色")
    @RequestMapping("/update")
    @RequiresPermissions("sys:role:update")
    public R update( SysRoleEntity role) {
        ValidatorUtils.validateEntity(role);

        role.setCreateUserId(getUserId());
        sysRoleService.update(role);

        return R.ok();
    }

    /**
     * 删除角色
     */
    @ApiOperation(value = "删除角色", httpMethod = "GET", notes = "删除角色")
    @SysLog("删除角色")
    @RequestMapping("/delete")
    @RequiresPermissions("sys:role:delete")
    public R delete( Long[] roleIds) {
        sysRoleService.deleteBatch(roleIds);

        return R.ok();
    }
}
