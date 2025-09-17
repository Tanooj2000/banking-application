package StepDefination;

import org.openqa.selenium.WebDriver;
import org.testng.Assert;

import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import pages.AdminSignUpPage;
import pages.HomePage;
import pages.UserSignUpPage;

public class CreateAccountStepdef {

	WebDriver driver = Hooks.driver;
	HomePage homepage;
	UserSignUpPage usersignup;
	AdminSignUpPage adminSignUp;

	@Given("Iam  on Home Page")
	public void iam_on_home_page() {

		homepage = new HomePage(driver);
		boolean actResult = homepage.validateHome();
		Assert.assertTrue(actResult);
	}

	@When("I Clicks on signup")
	public void i_clicks_on_signup() {
		homepage = new HomePage(driver);
		boolean actResult = homepage.clickSignup();
		Assert.assertTrue(actResult);

	}

	@When("I select User role")
	public void i_select_user_role() {
		usersignup = new UserSignUpPage(driver);
		boolean actResult = usersignup.clickOnUser();
		Assert.assertTrue(actResult);

	}

	@When("I enter {string} as Fullname and {string} as Email and {string} as MobileNumber and {string} as Password and {string} as confirmPassword and click on signup button")
	public void i_enter_as_fullname_and_as_email_and_as_mobile_number_and_as_password_and_as_confirm_password_and_click_on_signup_button(
			String string, String string2, String string3, String string4, String string5) {
		// usersignup =new UserSignUpPage(driver);
		usersignup.enterUserSignUpDetails(string, string2, string3, string4, string5);

	}

	@When("I select Admin role")
	public void i_select_admin_role() {
		adminSignUp = new AdminSignUpPage(driver);
		boolean actResult = adminSignUp.clickonadmin();
		Assert.assertTrue(actResult);
	}

	@When("I enter {string} as Email and {string} as BankName and   {string} as AdminPassword and click on the signup button")
	public void i_enter_as_fullname_and_as_email_and_as_bank_name_and_as_admin_password_and_click_on_the_signup_button(
			 String string2, String string3, String string4) {

		adminSignUp.enterUserSignUpDetails( string2, string3, string4);
	}

	@Then("I should see a success message {string}")
	public void i_should_see_a_success_message(String string) {
		// Write code here that turns the phrase above into concrete actions
		throw new io.cucumber.java.PendingException();
	}

}
