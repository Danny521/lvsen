package com.danny.commons.utils;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

public class ConfigUtil {

    public static void loadConf() {
        String confPath = System.getProperty("user.dir", "utf-8");
        String path = null;
        path = getConfFilePath(confPath);
        if (path != null) {
            confPath = path;
        }
        Properties prop = new Properties();
        try {
            InputStream in = new FileInputStream(confPath);
            prop.load(in);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public static String getConfFilePath(String filePath) {
        File file = new File(filePath);
        File[] listFiles = file.listFiles();
        String path = null;
        if (!file.isDirectory()) {
            if (file.getAbsolutePath().endsWith("application.properties")) {
                return file.getAbsolutePath();
            }
        } else {
            for (File f : listFiles) {
                path = getConfFilePath(f.getAbsolutePath());
                if (path != null && path.endsWith("application.properties")) {
                    return path;
                }
            }
        }
        return path;
    }
}
