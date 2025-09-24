@Component
public class AccountStrategyFactory {

    private final Map<String, AccountCreationStrategy> strategyMap = new HashMap<>();

    @Autowired
    public AccountStrategyFactory(List<AccountCreationStrategy> strategies) {
        for (AccountCreationStrategy strategy : strategies) {
            strategyMap.put(strategy.getCountryCode().toUpperCase(), strategy);
        }
    }

    public AccountCreationStrategy getStrategy(String countryCode) {
        return strategyMap.get(countryCode.toUpperCase());
    }
}