Feature: Create Account

  Background: 
    Given Iam  on Home Page

  @UserSignup
  Scenario Outline: User signs up successfully
    When I Clicks on signup
    And I select User role
    And I enter "<FullName>" as Fullname and "<Email>" as Email and "<MobileNumber>" as MobileNumber and "<Password>" as Password and "<Password>" as confirmPassword and click on signup button
    Then I should see a success message "User account created successfully"

    Examples: 
      | FullName    | Email            | MobileNumber | Password  |
      | Ravichandra | ravi12@gmail.com |   7569935527 | Ravi@2002 |

  @AdminSignup
  Scenario Outline: Admin signs up successfully
    When I Clicks on signup
    And I select Admin role
    And I enter "<Email>" as Email and "<BankName>" as BankName and   "<AdminPassword>" as AdminPassword and click on the signup button
    Then I should see a success message "Admin account created successfully"

    Examples: 
      | FullName   | Email            | BankName | AdminPassword |
      | adminUser1 | admin1@gmail.com | HDFC     | admin@123     |
