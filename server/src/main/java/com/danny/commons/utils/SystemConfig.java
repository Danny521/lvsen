package com.danny.commons.utils;

import java.io.IOException;
import java.util.Properties;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PropertiesLoaderUtils;
import org.springframework.util.StringUtils;

public class SystemConfig {

    private static Properties props = new Properties();

    static {
        try {
            Resource resource = new ClassPathResource("application.properties");
            PropertiesLoaderUtils.fillProperties(props, resource);
//            Resource resource2 = new ClassPathResource("config.properties");
//            PropertiesLoaderUtils.fillProperties(props, resource2);
        } catch (IOException e) {
            throw new RuntimeException();
        }
    }

    public static String getString(String key) {
        return props.getProperty(key);
    }

    public static Integer getInt(String key) {
        return Integer.valueOf(props.getProperty(key));
    }

    public static Long getLong(String key) {
        return Long.valueOf(props.getProperty(key));
    }

    public static Boolean getBoolean(String key) {
        return Boolean.valueOf(props.getProperty(key));
    }

    public static String getString(String key, String defaultValue) {
        return StringUtils.isEmpty(props.getProperty(key)) ? defaultValue : props.getProperty(key);
    }

    public static Integer getInt(String key, Integer defaultValue) {
        return StringUtils.isEmpty(props.getProperty(key)) ? defaultValue : Integer.valueOf(props.getProperty(key));
    }

    public static Long getLong(String key, Long defaultValue) {
        return StringUtils.isEmpty(props.getProperty(key)) ? defaultValue : Long.valueOf(props.getProperty(key));
    }

    public static Boolean getBoolean(String key, Boolean defaultValue) {
        return StringUtils.isEmpty(props.getProperty(key)) ? defaultValue : Boolean.valueOf(props.getProperty(key));
    }
}
