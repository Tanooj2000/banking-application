package pages;

import java.time.Duration;

import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import ObjectRepository.Locators;

public class UserSignUpPage {

	WebDriver driver;
	WebDriverWait wait;
	JavascriptExecutor jse;


	public UserSignUpPage(WebDriver driver) {

		this.driver = driver;
		wait = new WebDriverWait(driver, Duration.ofSeconds(20));
		jse=(JavascriptExecutor)driver;


	}
	
	public boolean clickOnUser() {
		
		driver.findElement(Locators.usersignUp).click();
		
		boolean actresult;
		try {
			wait.until(ExpectedConditions.visibilityOfElementLocated(Locators.validateusersignup));
			actresult = true;
		} catch (TimeoutException ee) {
			actresult = false;
		}
		return actresult;
	}
	
	public void enterUserSignUpDetails(String fullName, String email, String mobileNumber, String Password , String confirmPassword ) {
		WebElement signupp=driver.findElement(Locators.SignUpButton);
		jse.executeScript("arguments[0].scrollIntoView()", signupp);
		driver.findElement(Locators.fullName).sendKeys(fullName);
		driver.findElement(Locators.email).sendKeys(email);
		driver.findElement(Locators.mobilenumber).sendKeys(mobileNumber);
		driver.findElement(Locators.password).sendKeys(Password);
		driver.findElement(Locators.confirmpassword).sendKeys(confirmPassword);
		
		driver.findElement(Locators.SignUpButton).click();
		
	}

}
