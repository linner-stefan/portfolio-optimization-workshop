package com.capco.spa;

import java.util.concurrent.Executor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.support.SpringBootServletInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import com.capco.spa.config.MdcTaskDecorator;

@SpringBootApplication
@EnableAsync(proxyTargetClass = true)
@EnableAspectJAutoProxy(proxyTargetClass = true)
public class SpaBackendApplication extends SpringBootServletInitializer {

	@Value( "${spa.thread.pool-size}" )
	private int threadPoolSize;

	public static void main(String[] args) {
		//local
		ConfigurableApplicationContext applicationContext = new SpringApplicationBuilder(SpaBackendApplication.class)
				.properties("spring.config.location:classpath:/,classpath:/local/")
				.build().run(args);

	}

	@Override
	protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
		return application.sources(SpaBackendApplication.class);
	}

	@Bean
	public Executor taskExecutor() {
		ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
		executor.setCorePoolSize( threadPoolSize );
		executor.setTaskDecorator(new MdcTaskDecorator());
		executor.initialize();
		return executor;
	}

}
