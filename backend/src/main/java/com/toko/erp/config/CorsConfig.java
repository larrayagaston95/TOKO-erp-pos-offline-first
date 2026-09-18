package com.toko.erp.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * ============================================================================
 * CONFIGURACIÓN CORS (Cross-Origin Resource Sharing)
 * ============================================================================
 * Habilita el acceso desde el frontend (React/Vite) al backend Spring Boot,
 * evitando bloqueos de seguridad del navegador durante el desarrollo y en
 * producción.
 */
@Configuration
public class CorsConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**") // Aplica a todos los endpoints
                        .allowedOrigins(
                                "http://localhost:3000", // Típico Create React App / Next.js
                                "http://localhost:5173"  // Típico Vite (nuestro caso)
                                // TODO: Añadir aquí la URL de producción cuando se despliegue
                                // "https://miapp.dominio.com"
                        )
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(false); // Cambiar a true si se usan cookies/sesiones cruzadas
            }
        };
    }
}
