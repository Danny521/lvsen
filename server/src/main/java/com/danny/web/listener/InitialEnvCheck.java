package com.danny.web.listener;

import org.springframework.context.ApplicationContext;

/**
  * @ClassName: InitialEnvCheck
  * @Description: web系统启动的检查项接口
  * @author Administrator
  * @date 2016年4月6日 下午2:05:22
  *
  */
public interface InitialEnvCheck {
    
    /**
      * @Title: check
      * @Description: 检查servlet上下文环境
      * @param context
      */
    public void check(ApplicationContext context);
}
