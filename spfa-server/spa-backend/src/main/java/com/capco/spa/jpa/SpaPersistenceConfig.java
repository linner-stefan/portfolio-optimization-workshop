package com.capco.spa.jpa;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.JpaVendorAdapter;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableTransactionManagement
@EnableJpaRepositories(
        entityManagerFactoryRef = "primaryEM",
        transactionManagerRef = "primaryTM",
        basePackages = {"com.capco.spa.jpa.dao"})
public class SpaPersistenceConfig {

    @Autowired
    @Qualifier("primaryDS")
    private DataSource dataSource;

    @Bean
    public EntityManager entityManager(@Qualifier("primaryEM") EntityManagerFactory entityManagerFactory) {
        return entityManagerFactory.createEntityManager();
    }

    @Primary
    @Bean(name = "primaryEM")
    public LocalContainerEntityManagerFactoryBean loadingEntityManagerFactory(SpaJpaConfiguration spaJpaConfiguration) {
        LocalContainerEntityManagerFactoryBean em = new LocalContainerEntityManagerFactoryBean();
        em.setDataSource(dataSource);
        em.setPersistenceUnitName("primaryPU");
        em.setPackagesToScan("com.capco.spa.jpa.entity");
        em.setJpaPropertyMap(spaJpaConfiguration.getProperties());
//        em.afterPropertiesSet();

        JpaVendorAdapter vendorAdapter = new HibernateJpaVendorAdapter();
        em.setJpaVendorAdapter(vendorAdapter);

        return em;
    }

    @Primary
    @Bean(name = "primaryTM")
    public PlatformTransactionManager transactionManager(
            @Qualifier("primaryEM") EntityManagerFactory entityManagerFactory) {
        return new JpaTransactionManager(entityManagerFactory);
    }


    @Configuration
    @ConfigurationProperties("spa.jpa")
    public class SpaJpaConfiguration {

        private final Map<String, String> properties = new HashMap<>();

        public Map<String, String> getProperties() {
            return properties;
        }
    }

}
