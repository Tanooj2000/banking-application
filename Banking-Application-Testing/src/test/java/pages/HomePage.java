package pages;

import java.time.Duration;

import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import ObjectRepository.Locators;

public class HomePage {
	WebDriver driver;
	WebDriverWait wait;

	public HomePage(WebDriver driver) {

		this.driver = driver;
		wait = new WebDriverWait(driver, Duration.ofSeconds(20));

	}

	public boolean validateHome() {
		WebElement txt = driver.findElement(Locators.hometxt);

		boolean actresult;
		try {
			wait.until(ExpectedConditions.visibilityOfElementLocated(Locators.hometxt));
			actresult = true;
		} catch (TimeoutException ee) {
			actresult = false;
		}
		return actresult;

	}

	public boolean clickSignup() {

		driver.findElement(Locators.signUp).click();
		boolean actresult;
		try {
			wait.until(ExpectedConditions.visibilityOfElementLocated(Locators.validatesignup));
			actresult = true;
		} catch (TimeoutException ee) {
			actresult = false;
		}
		return actresult;

	}
}
