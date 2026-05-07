package com.example.rag_chatbot_service;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.client.RestTemplate;

@SpringBootApplication
public class RagChatbotServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(RagChatbotServiceApplication.class, args);
	}

	// Bean for RestTemplate
	@Bean
	public RestTemplate restTemplate() {
		return new RestTemplate();
	}

	// Global CORS configuration
	@Bean
	public WebMvcConfigurer corsConfigurer() {
		return new WebMvcConfigurer() {
			@Override
			public void addCorsMappings(CorsRegistry registry) {
				registry.addMapping("/**")
						.allowedOrigins("*")
						.allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
						.allowedHeaders("*");
			}
		};
	}
}


// ...existing code...

