package com.lvsen.modules.sys.controller;

import com.lvsen.common.utils.Constant;
import com.lvsen.common.utils.PageUtils;
import com.lvsen.common.utils.Query;
import com.lvsen.common.utils.R;
import com.lvsen.common.annotation.SysLog;
import com.lvsen.common.validator.Assert;
import com.lvsen.common.validator.ValidatorUtils;
import com.lvsen.common.validator.group.AddGroup;
import com.lvsen.common.validator.group.UpdateGroup;
import com.lvsen.modules.sys.entity.SysUserEntity;
import com.lvsen.modules.sys.service.SysUserRoleService;
import com.lvsen.modules.sys.service.SysUserService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import org.apache.commons.lang.ArrayUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.shiro.authz.annotation.RequiresPermissions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 系统用户
 * 
 * @author zhangtao
 * @email ceozhangtao@qq.com
 * @date 2016年10月31日 上午10:40:10
 */
@Api(tags = { "用户管理" })
@RestController
@RequestMapping("/sys/user")
public class SysUserController extends AbstractController {
    @Autowired
    private SysUserService sysUserService;
    @Autowired
    private SysUserRoleService sysUserRoleService;

    /**
     * 所有用户列表
     */
    @ApiOperation(value = "查询用户列表", httpMethod = "POST", notes = "查询用户列表")
    @RequestMapping("/list")
    @RequiresPermissions("sys:user:list")
    public R list(@ApiParam(value = "用户名称或者帐号") @RequestParam(value = "key", required = false) String key,
                  @ApiParam(value = "当前页码", required = true) @RequestParam(value = "currentPage", defaultValue = "1") Integer currentPage,
                  @ApiParam(value = "每页数量", required = true) @RequestParam(value = "pageSize", defaultValue = "20") Integer pageSize,
                  @ApiParam(value = "排序属性") @RequestParam(value = "orderKey", defaultValue = "username", required = false) String orderKey,
                  @ApiParam(value = "状态") @RequestParam(value = "status", required = false, defaultValue = "1") Integer status) {
        Map<String, Object> params = new HashMap<>();
        // 只有超级管理员，才能查看所有管理员列表
        if (getUserId() != Constant.SUPER_ADMIN) {
            params.put("createUserId", getUserId());
        }
        params.put("page", currentPage);
        params.put("limit", pageSize);
        params.put("order", orderKey);
        if (!StringUtils.isBlank(key)) {
            params.put("key", key);
        }

        // 查询列表数据
        Query query = new Query(params);
        List<SysUserEntity> userList = sysUserService.queryList(query);
        int total = sysUserService.queryTotal(query);

        PageUtils pageUtil = new PageUtils(userList, total, query.getLimit(), query.getPage());

        return R.ok().putData(pageUtil);
    }

    /**
     * 获取登录的用户信息
     */
    @ApiOperation(value = "获取登录的用户信息", httpMethod = "GET", notes = "获取登录的用户信息")
    @RequestMapping("/info")
    public R info() {
        return R.ok().putData(getUser());
    }

    /**
     * 修改登录用户密码
     */
    @ApiOperation(value = "修改密码", httpMethod = "POST", notes = "修改密码")
    @SysLog("修改密码")
    @RequestMapping("/password")
    public R password(String password, String newPassword) {
        Assert.isBlank(newPassword, "新密码不为能空");

        // md5加密
        // password = new Md5Hash(password).toHex();
        // md5加密
        // newPassword = new Md5Hash(password).toHex();
        // 更新密码
        int count = sysUserService.updatePassword(getUserId(), password, newPassword);
        if (count == 0) {
            return R.error("原密码不正确");
        }

        return R.ok();
    }

    /**
     * 用户信息
     */
    @ApiOperation(value = "获取用户信息", httpMethod = "GET", notes = "获取用户信息")
    @RequestMapping("/info/{userId}")
    @RequiresPermissions("sys:user:info")
    public R info(@PathVariable("userId") Long userId) {
        SysUserEntity user = sysUserService.queryObject(userId);

        // 获取用户所属的角色列表
        List<Long> roleIdList = sysUserRoleService.queryRoleIdList(userId);
        user.setRoleIdList(roleIdList);

        return R.ok().putData(user);
    }

    /**
     * 保存用户
     */
    @ApiOperation(value = "保存用户", httpMethod = "POST", notes = "保存用户")
    @SysLog("保存用户")
    @RequestMapping(value = "/save", method = RequestMethod.POST)
    @RequiresPermissions("sys:user:save")
    public R save( SysUserEntity user) {
        ValidatorUtils.validateEntity(user, AddGroup.class);

        user.setCreateUserId(getUserId());
        sysUserService.save(user);

        return R.ok();
    }

    /**
     * 修改用户
     */
    @ApiOperation(value = "修改用户", httpMethod = "POST", notes = "修改用户")
    @SysLog("修改用户")
    @RequestMapping(value = "/update", method = RequestMethod.POST)
    @RequiresPermissions("sys:user:update")
    public R update(SysUserEntity user) {
        ValidatorUtils.validateEntity(user, UpdateGroup.class);

        user.setCreateUserId(getUserId());
        sysUserService.update(user);

        return R.ok();
    }

    /**
     * 删除用户
     */
    @ApiOperation(value = "删除用户", httpMethod = "GET", notes = "删除用户")
    @SysLog("删除用户")
    @RequestMapping("/delete")
    @RequiresPermissions("sys:user:delete")
    public R delete( Long[] userIds) {
        if (ArrayUtils.contains(userIds, 1L)) {
            return R.error("系统管理员不能删除");
        }

        if (ArrayUtils.contains(userIds, getUserId())) {
            return R.error("当前用户不能删除");
        }

        sysUserService.deleteBatch(userIds);

        return R.ok();
    }
}
