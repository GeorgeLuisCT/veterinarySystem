package com.gaedet.veterinarysystem;

import org.junit.jupiter.api.Test;
import com.gaedet.veterinarysystem.security.service.InitializerService;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class VeterinarySystemApplicationTests {

	@MockBean
	private InitializerService initializerService;

	@Test
	void contextLoads() {
	}

}
