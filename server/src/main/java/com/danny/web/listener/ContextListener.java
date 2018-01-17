package com.danny.web.listener;

import java.util.ArrayList;
import java.util.List;

import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationListener;
import org.springframework.context.event.ContextRefreshedEvent;

public class ContextListener implements ApplicationListener<ContextRefreshedEvent> {

	private List<InitialEnvCheck> checkers = new ArrayList<InitialEnvCheck>();

	@Override
	public void onApplicationEvent(ContextRefreshedEvent event) {
		ApplicationContext context = event.getApplicationContext();
		System.out.println("--------------->>>>服务初始化...");
		// checkers.add(new PfsPathCheck());
		// checkers.add(new AuthorizationCheck());
		// checkers.add(new MemoryDataCheck());
		// checkers.add(new PvdPermissionCheck());
		// checkers.add(new SystemFunctionChecker());
		for (InitialEnvCheck checker : checkers) {
			checker.check(context);
		}
	}
}
