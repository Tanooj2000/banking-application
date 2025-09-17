package pages;

import java.time.Duration;

import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import ObjectRepository.Locators;

public class AdminSignUpPage {

	WebDriver driver;
	WebDriverWait wait;
	JavascriptExecutor jse;

	public AdminSignUpPage(WebDriver driver) {

		this.driver = driver;
		wait = new WebDriverWait(driver, Duration.ofSeconds(20));
		jse=(JavascriptExecutor)driver;

	}
	
public boolean clickonadmin() {
		
		driver.findElement(Locators.adminsingup).click();
		
		boolean actresult;
		try {
			wait.until(ExpectedConditions.visibilityOfElementLocated(Locators.validateadminsignup));
			actresult = true;
		} catch (TimeoutException ee) {
			actresult = false;
		}
		return actresult;
	}

public void enterUserSignUpDetails(String email, String bankName, String adminPassword ) {
	
	WebElement signupp=driver.findElement(Locators.SignUpButton);
	jse.executeScript("arguments[0].scrollIntoView()", signupp);
	driver.findElement(Locators.bankName).sendKeys(bankName);
	//driver.findElement(Locators.fullName).sendKeys(fullName);
	driver.findElement(Locators.email).sendKeys(email);
	
	driver.findElement(Locators.adminpassword).sendKeys(adminPassword);
	driver.findElement(Locators.SignUpButton).click();
	
}
	
}
