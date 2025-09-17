package runner;

import io.cucumber.testng.AbstractTestNGCucumberTests;
import io.cucumber.testng.CucumberOptions;

@CucumberOptions(features = "src\\test\\resources\\features", glue = "StepDefination", plugin = { "pretty",
		"html:target/cucumber-reports.html",

}, monochrome = true ,
		tags = "@UserSignup"
		
		
		)
public class TestRunner extends AbstractTestNGCucumberTests {

}

//"io.qameta.allure.cucumber7jvm.AllureCucumber7Jvm"