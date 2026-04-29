# Validation Rules (Frontend)

Last updated: 2026-04-23

Primary utility source: frontend validation utility module and form-level checks.

## Rule Matrix
| Field | Rule | Example Valid | Example Invalid | Typical Message |
|---|---|---|---|---|
| Gmail email | Must match gmail pattern | `user@gmail.com` | `user@yahoo.com` | Enter a valid Gmail address |
| Password | Min length 8, uppercase, lowercase, number, special char | `BankApp@123` | `password` | Password strength requirement not met |
| Username/Name | Letters-only constraints, minimum length checks | `JohnDoe` | `John 123` | Name can only contain letters |
| Full Name | Letters + spaces, no leading/trailing spaces, min length | `John Smith` | ` John` | Full name format invalid |
| Mobile | 10 digits | `9876543210` | `98765` | Enter a valid 10-digit mobile number |
| Confirm Password | Must match new password | `same-as-new` | `different` | Passwords do not match |
| Bank Name | Minimum length and basic validity | `Axis Bank` | `A` | Bank name too short |

## Where Applied
- Sign-up forms (user/admin)
- Profile update forms (user/admin)
- Password change forms (user/admin)
- Account creation flow
- Branch creation flow (basic validation in API wrapper + UI)

## Validation Design Principles
- Fail fast before API call for obvious invalid inputs
- Keep user-facing messages actionable and non-technical
- Use centralized utility functions to maintain consistency
- Avoid allowing malformed payloads to reach backend

## Maintenance Rule
When validation rules change in utility code, update this matrix and impacted workflow docs in the same PR.
