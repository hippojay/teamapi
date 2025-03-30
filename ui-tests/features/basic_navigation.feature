Feature: Basic Navigation
  As a user of the "Who What Where" application
  I want to be able to navigate through the application
  So that I can access different sections and view relevant information

  Background:
    Given I am a normal user accessing the application

  Scenario: Accessing the application homepage
    When I navigate to the home page
    Then I should see the sidebar menu
    And I should see the header menu
    And I should see summary boxes
    And I should not see any error messages

  Scenario: Navigating using the sidebar menu
    Given I am on the home page
    When I click on a menu item in the sidebar
    Then I should be navigated to a new page
    And the new page should be populated with relevant data or a no-data message
    And I should not see any error messages

  Scenario: Viewing Tribes section
    Given I am on the home page
    When I click on "Tribes" in the sidebar menu
    Then I should see a list of all tribes
    And I should not see any error messages

 Scenario: Viewing Cluster section
    Given I am on the home page
    When I click on "Cluster" in the sidebar menu
    Then I should see a list of all clusters
    And I should not see any error messages

 Scenario: Viewing Squads section
    Given I am on the home page
    When I click on "squads" in the sidebar menu
    Then I should see a list of all squads
    And I should not see any error messages

 Scenario: Viewing Team Members section
    Given I am on the home page
    When I click on "team members" in the sidebar menu
    Then I should see a list of all team members
    And I should not see any error messages

 Scenario: Viewing Services section
    Given I am on the home page
    When I click on "services" in the sidebar menu
    Then I should see a list of all services
    And I should not see any error messages

 Scenario: Viewing Org Explorer section
    Given I am on the home page
    When I click on "Org Explorer" in the sidebar menu
    Then I should see a list of all areas
    And I should not see any error messages

  Scenario: Viewing OKRs section
    Given I am on the home page
    When I click on "OKRs" in the sidebar menu
    Then I should see a list of all areas
    And I should not see any error messages
  