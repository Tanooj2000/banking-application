package ObjectRepository;

import org.openqa.selenium.By;

public class Locators {
	public static By hometxt = By.xpath("//div[contains(text(),\"Good Afternoon\")]");
	public static By signUp = By.xpath("//a[text()=\"Sign Up\"]");
	public static By validatesignup = By.xpath("//p[text()=\"How do you want to sign up?\"]");
	
	
	public static By usersignUp = By.xpath("//input[@value=\"user\"]");
	public static By validateusersignup = By.id("mobile");
	public static By fullName=By.id("name");
	public static By email=By.id("email");
	public static By mobilenumber=By.id("mobile");
	public static By password=By.id("password");
	public static By confirmpassword=By.id("confirmPassword");
	public static By SignUpButton= By.xpath("//button[text()=\"Sign Up\"]");
	
	
	public static By adminsingup = By.xpath("//input[@value=\"admin\"]");
	public static By validateadminsignup = By.id("bankName");
	public static By bankName =  By.id("bankName");
	public static By adminpassword=By.id("adminPassword");
	
	public static By signIn=By.xpath("//a[text()=\"Sign In\"]");
	public static By usersignIn=By.xpath("//button[text()=\" Sign in as User \"]");
	public static By adminsigIn=By.xpath("//button[text()=\" Sign in as Admin \"]");
	
	




}
