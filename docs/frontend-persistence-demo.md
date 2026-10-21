# Selenium notes and frontend persistence demo

## Frontend persistence demo

This project uses a lightweight frontend auth/session demo instead of storing JWTs in browser storage.

### Current behavior

- The Angular session state lives in `AuthSessionService` and uses Angular signals.
- `accessToken` is kept in memory only.
- `demoMode` is set when the local demo sign-in is used in development builds.
- The app intentionally avoids writing tokens to `localStorage` or `sessionStorage`.

This is a good demo for the security tradeoff:

- In-memory state is simple for local development and automated UI testing.
- Browser storage is not used, which reduces the risk of token leakage via XSS or accidental persistence across tabs.
- The demo sign-in is only enabled in development builds: `environment.development.ts` sets `testSignInEnabled: true`, while the production config disables it.

### Demo flow

1. Open the app in development mode.
2. Click `Open local demo` on the login page.
3. `startDemoSession()` flips the app into demo mode and redirects to `/customers`.
4. The app treats the user as signed in without an actual backend token.
5. On logout, both the access token and demo mode are cleared.

## Selenium notes

### Test strategy

For automated UI testing, prefer stable selectors over fragile CSS paths.

This project already includes `data-testid` hooks such as:

- `username`
- `password`
- `sign-in`
- `test-sign-in`
- `register`

### Recommended Selenium pattern

Use explicit waits instead of sleep-based timing. The Angular app can take a moment to render after route changes and form interactions.

Example Python pattern:

```python
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

driver = webdriver.Chrome()
wait = WebDriverWait(driver, 10)

driver.get("http://localhost:4200")

wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, '[data-testid="test-sign-in"]'))).click()
wait.until(EC.url_contains("/customers"))

customer_search = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="customer-search"]')))
assert "Amina" in driver.page_source or customer_search is not None
```

### Example test scenarios

- Open app and confirm login page renders.
- Click `Open local demo` and verify redirect to `/customers`.
- Search for a customer such as `Amina` or `CUS-1001`.
- Confirm an empty/not-found person message when searching an unknown ID.
- Log out and verify the user is sent back to the login page.

### Notes for the team

- This is a demo-friendly approach for local testing.
- It is not a replacement for a real auth implementation.
- Production should use secure token handling and server-side validation.
- Selenium tests should be kept deterministic by avoiding unnecessary page state persistence between runs.
