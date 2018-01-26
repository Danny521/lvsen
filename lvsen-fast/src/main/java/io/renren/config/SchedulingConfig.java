package io.renren.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

/**   
* @Description: 定时任务
* @author zhangtao
* @date 2018年1月2日 下午6:05:09 
*/
@Configuration
@EnableScheduling
public class SchedulingConfig {
    private static final Logger LOG = LoggerFactory.getLogger(SchedulingConfig.class);
//	@Scheduled(cron = "0/10 * * * * *")
	public void testJob() {
	    LOG.info("------>THIS IS A SCHEDULE TASK");
	}
	
//	@Scheduled(fixedRate=10000)
    public void testJob2() {
//        System.out.println("=========>");
//        LOG.info("-########>");
    }
}
