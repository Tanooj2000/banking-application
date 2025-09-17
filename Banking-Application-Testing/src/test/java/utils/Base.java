package utils;

import java.util.Properties;

import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.edge.EdgeDriver;
import org.openqa.selenium.firefox.FirefoxDriver;

public class Base {
	static public WebDriver driver;

	public void launchBrowser() {
		Properties prop = PropertyReader.readProperty();
		System.out.println(prop.getProperty("Browser"));
		if (prop.getProperty("Browser").equalsIgnoreCase("chrome")) {
			driver = new ChromeDriver();
		} else if (prop.getProperty("Browser").equalsIgnoreCase("firefox")) {
			driver = new FirefoxDriver();
		} else if (prop.getProperty("Browser").equalsIgnoreCase("edge")) {
			driver = new EdgeDriver();
		} else {
			System.out.println("Enter either chrome or edge or firefox only");
		}
		driver.manage().window().maximize();
		driver.get(prop.getProperty("URL"));
	}
}