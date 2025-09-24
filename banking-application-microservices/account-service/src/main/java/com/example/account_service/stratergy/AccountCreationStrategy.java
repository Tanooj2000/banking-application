public interface AccountCreationStrategy {
    void createAccount(Object request);
    String getCountryCode();
}