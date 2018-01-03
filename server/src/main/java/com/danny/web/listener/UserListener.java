package com.danny.web.listener;

import javax.servlet.ServletRequestEvent;
import javax.servlet.ServletRequestListener;
import javax.servlet.annotation.WebListener;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSessionAttributeListener;
import javax.servlet.http.HttpSessionBindingEvent;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationListener;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.util.StringUtils;

import com.danny.commons.utils.SessionKey;

/**
 * 对于用户session创建以及销毁建立监听
 * 
 * @author zhangtao
 *
 */
@WebListener
public class UserListener implements HttpSessionAttributeListener, ServletRequestListener, ApplicationListener<ContextRefreshedEvent> {

    private Logger logger = LoggerFactory.getLogger(UserListener.class);
    private ThreadLocal<HttpServletRequest> request = new ThreadLocal<HttpServletRequest>();


    // 浏览器嵌套弹出浏览器的特殊头标识
    private static final String HEADER_WEBDIALOG = "webdialog";

    @Override
    public void attributeAdded(HttpSessionBindingEvent se) {
        String webDialogStr = request.get().getHeader(HEADER_WEBDIALOG);
        if (!StringUtils.isEmpty(webDialogStr) && Boolean.parseBoolean(webDialogStr)) {
            return;
        }

//        if (se.getName().equalsIgnoreCase(SessionKey.KEY_USER)) {
//            LogBean log = new LogBean();
//            log.setModule("登录");
//            log.setFunction("");
//            log.setDescription("登录系统");
//            BasicUserVo user = JsonUtil.toObject(BasicUserVo.class, se.getValue().toString());
//            log.setUserName(user.getLoginName());
//            log.setOrgId(UserTools.getUserOrgId(request.get()));
//            log.setIp(LogHelper.getHeader(request.get(), "X-real-ip"));
//            log.setCreateDate(new Date());
//            saveLog(log, true);
//            // 改变用户在线状态
//            ApplicationContext ctx = WebApplicationContextUtils.getRequiredWebApplicationContext(se.getSession().getServletContext());
//            setUserIsOnline(ctx, user, UserCenterConstant.user_isOnline);
//        }
    }

    @Override
    public void attributeRemoved(HttpSessionBindingEvent se) {
        if (se.getName().equalsIgnoreCase(SessionKey.KEY_USER)) {

//            ApplicationContext ctx = WebApplicationContextUtils.getRequiredWebApplicationContext(se.getSession().getServletContext());
//            BasicUserVo user = JsonUtil.toObject(BasicUserVo.class, se.getValue().toString());
//            // 改变用户在线状态（注销、session失效）
//            setUserIsOnline(ctx, user, UserCenterConstant.user_isOffline);
//
//            // 暂时不记录session过期后的登出日志
//            if (request.get() == null) {
//                return;
//            }
//            // 用户登出的日志信息
//            LogBean log = new LogBean();
//            log.setModule("注销");
//            log.setFunction("");
//            log.setDescription("注销系统");
//            logger.info("userLogout:" + user.getLoginName());
//            log.setUserName(user.getLoginName());
//            log.setOrgId(user.getOrgID() != null ? user.getOrgID().intValue() : -1);
//            log.setIp(LogHelper.getHeader(request.get(), "X-real-ip"));
//            log.setCreateDate(new Date());
//            saveLog(log, false);
        }
    }

    @Override
    public void attributeReplaced(HttpSessionBindingEvent se) {
    }

    @Override
    public void requestDestroyed(ServletRequestEvent sre) {
    }

    @Override
    public void requestInitialized(ServletRequestEvent sre) {
        request.set((HttpServletRequest) sre.getServletRequest());
    }

    /**
     * 单独线程来记录日志,避免登录过程被阻塞
     * 
     * @param log
     * @param isIncreaseLoginNum
     *            --是否增加在线人数,true登录记录,false登出不记录
     */
//    private void saveLog(final LogBean log, final boolean isIncreaseLoginNum) {
//        new Thread(new Runnable() {
//            @Override
//            public void run() {
//                try {
//                    logService.saveLog(log, 1);
//                    if (isIncreaseLoginNum) {
//                        resourceService.statisticsLoginNumber();
//                    }
//                } catch (Exception e) {
//                    logger.error("登录日志记录失败");
//                }
//            }
//        }).start();
//    }

    /**
     * 异步更新用户在线状态
     * 
     * @param user
     * @param isOnline
     *            ， 0：在线；1：离线
     */
//    private void setUserIsOnline(final ApplicationContext ctx, final BasicUserVo user, final Integer isOnline) {
//        new Thread(new Runnable() {
//            @Override
//            public void run() {
//                try {
//                } catch (Exception e) {
//                    logger.error("用户在线状态更新失败");
//                }
//            }
//        }).start();
//    }

    @Override
    public void onApplicationEvent(ContextRefreshedEvent event) {
        try {
            ApplicationContext context = event.getApplicationContext();
//            logService = context.getBean("logService", ILogService.class);
//            resourceService = context.getBean("resourceService", IResourceService.class);
        } catch (Exception ex) {
            logger.error(ex.getMessage(), ex);
        }
    }
}
