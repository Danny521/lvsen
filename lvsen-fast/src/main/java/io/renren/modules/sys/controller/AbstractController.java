package io.renren.modules.sys.controller;

import org.apache.shiro.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import io.renren.modules.sys.entity.SysUserEntity;

/**
 * Controller公共组件
 * 
 * @author chenshun
 * @email sunlightcs@gmail.com
 * @date 2016年11月9日 下午9:42:26
 */
public abstract class AbstractController {
	protected Logger logger = LoggerFactory.getLogger(getClass());
	
	protected SysUserEntity getUser() {
//	    SysUserEntity user = new SysUserEntity();
//	    user.setUserId(1L);
//	    user.setAccount("admin");
//	    user.setPassword("0192023a7bbd73250516f069df18b500");
//	    user.setStatus(1);
//	    user.setUsername("admin");
//	    user.setCreateUserId(1L);
//	    user.setSex(1);
//		return user;
		return (SysUserEntity) SecurityUtils.getSubject().getPrincipal();
	}

	protected Long getUserId() {
		return getUser().getUserId();
//		return 1L;
	}
}
