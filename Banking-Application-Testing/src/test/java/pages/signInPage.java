package pages;

import java.time.Duration;

import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.ui.WebDriverWait;

public class signInPage {
	WebDriver driver;
	WebDriverWait wait;
	JavascriptExecutor jse;


	public signInPage(WebDriver driver) {

		this.driver = driver;
		wait = new WebDriverWait(driver, Duration.ofSeconds(20));
		jse=(JavascriptExecutor)driver;

	}
	
	public void clicksignIn() {
		
	}
	
	
}
