package StepDefination;

import io.cucumber.java.After;
import io.cucumber.java.AfterAll;
import io.cucumber.java.Before;
import io.cucumber.java.BeforeAll;
import io.cucumber.java.Scenario;
import utils.Base;

public class Hooks extends Base {

	@Before()
	public void beforeScenario(Scenario scenario) {
		launchBrowser();

	}

	@After()
	public void afterScenario() {

		//driver.quit();
	}

}