package com.danny.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class SystemInitialization implements ApplicationRunner {
    @Override
    public void run(ApplicationArguments args) throws Exception {
        // TODO 系统启动后自执行代码
        System.out.println("-------->server started...");
    }

}
