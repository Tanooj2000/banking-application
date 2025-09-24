@Component
public class IndiaAccountStrategy implements AccountCreationStrategy {

    @Autowired
    private AccountRepository accountRepository;

    @Override
    public void createAccount(Object request) {
    IndiaAccountRequest req = (IndiaAccountRequest) request;

    Account account = new Account();
    account.userId = req.userId;
    account.country = "IN";
    account.fullName = req.fullName;
    account.aadhaar = req.aadhaar;
    account.pan = req.pan;
    account.mobile = req.mobile;
    account.email = req.email;
    account.dob = req.dob;
    account.gender = req.gender;
    account.occupation = req.occupation;
    account.address = req.address;
    account.deposit = req.deposit;
    account.consent = req.consent;
    account.accountType = req.accountType;
    account.status = req.status;

    accountRepository.save(account);
    }

    @Override
    public String getCountryCode() {
        return "IN";
    }
}