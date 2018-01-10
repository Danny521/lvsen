package com.danny.web.listener;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

/**
 * 初始化系统权限
 */
@Component
@Slf4j
public class PermissionInitStartup implements ApplicationListener<ApplicationReadyEvent> {
	
	@Override
	public void onApplicationEvent(ApplicationReadyEvent event) {
		//加载不同的权限模板
		try {
			log.info("初始化功能权限元数据成功");
		} catch (Exception e) {
			log.error("初始化功能权限元数据失败",e);
		}finally{
		}
	}
}
