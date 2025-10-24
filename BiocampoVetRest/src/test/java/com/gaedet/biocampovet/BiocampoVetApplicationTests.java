package com.gaedet.biocampovet;

import org.junit.jupiter.api.Test;
import com.gaedet.biocampovet.security.service.InitializerService;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class BiocampoVetApplicationTests {

	@MockBean
	private InitializerService initializerService;

	@Test
	void contextLoads() {
	}

}
