import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class UsaAccountRequest {
    public Long userId;
    public String fullName;
    public String ssn;
    public String mobile;
    public String email;
    public LocalDate dob;
    public String gender;
    public String occupation;
    public String address;
    public String idProofType;
    public BigDecimal deposit;
    public boolean consent;
}
