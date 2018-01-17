package com.danny.web.interceptors;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.web.context.support.WebApplicationContextUtils;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.ModelAndView;
import org.springframework.web.servlet.handler.HandlerInterceptorAdapter;

public class LoggerInterceptor extends HandlerInterceptorAdapter {

    private static final Logger logger = LoggerFactory.getLogger(LoggerInterceptor.class);
    private static final String LOG_SUFFIX = "Log";
    private static final String LOG_METHOD_AFTER = "After";
    private static final String LOG_METHOD_BEFORE = "Before";

    //采集日志记录前的信息（拦截器为线程不完全）
    private ThreadLocal<String> resultThreadLocal = new ThreadLocal<String>();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        logger.debug("Before handling the request");
        try {
            HandlerMethod handlerMethod = (HandlerMethod) handler;
            logger.debug(handlerMethod.getMethod().getName() + "\t" + handlerMethod.getBeanType().getSimpleName());

            String beanName = toLowerCase(handlerMethod.getBeanType().getSimpleName());
            logger.debug(beanName.concat(LOG_SUFFIX));

            ApplicationContext applicationContext = WebApplicationContextUtils.getWebApplicationContext(request.getSession().getServletContext());
            Object targetObject = applicationContext.getBean(beanName.concat(LOG_SUFFIX));
            if (targetObject != null) {

                Method method = targetObject.getClass().getMethod(handlerMethod.getMethod().getName().concat(LOG_METHOD_BEFORE), HttpServletRequest.class);
                if (method != null) {
                    Object info = method.invoke(targetObject, request);
                    String result = info == null ? "" : info.toString();
                    resultThreadLocal.set(result);
                }
            }
            //以下异常只需扑捉无需处理(异常为找不到日志记录的类和方法,没必要显示)
        } catch (NoSuchMethodException e) {
        } catch (InvocationTargetException e) {
        } catch (IllegalAccessException e) {
        } catch (BeansException e) {
        } catch (ClassCastException e) {
        }

        return true;
    }

    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) throws Exception {
        logger.debug("After handling the request");
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        logger.debug("After rendering the view");

        try {
            HandlerMethod handlerMethod = (HandlerMethod) handler;

            logger.debug(handlerMethod.getMethod().getName() + "\t" + handlerMethod.getBeanType().getSimpleName());
            String beanName = toLowerCase(handlerMethod.getBeanType().getSimpleName());


            logger.debug(beanName.concat(LOG_SUFFIX));

            ApplicationContext applicationContext = WebApplicationContextUtils.getWebApplicationContext(request.getSession().getServletContext());
            Object targetObject = applicationContext.getBean(beanName.concat(LOG_SUFFIX));
            if (targetObject != null) {

                Method method = targetObject.getClass().getMethod(handlerMethod.getMethod().getName().concat(LOG_METHOD_AFTER), String.class);
                if (method != null) {
                    method.invoke(targetObject, resultThreadLocal.get());
                }
            }
            //以下异常只需扑捉无需处理(异常为找不到日志记录的类和方法,没必要显示)
        } catch (NoSuchMethodException e) {
        } catch (InvocationTargetException e) {
        } catch (IllegalAccessException e) {
        } catch (BeansException e) {
        } catch (ClassCastException e) {
        }

    }

    /**
     * 使字符串第一个字母如果大写的转换成小写
     * 否则不处理
     *
     * @param target 预处理字符串
     * @return
     */
    private String toLowerCase(String target) {
        char[] chars = new char[1];
        chars[0] = target.charAt(0);
        String temp = new String(chars);
        if (chars[0] >= 'A' && chars[0] <= 'Z') {
            return target.replaceFirst(temp, temp.toLowerCase());
        }
        return temp;
    }
}
