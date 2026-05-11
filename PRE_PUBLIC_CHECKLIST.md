# Pre-Public Release Checklist

This checklist is for internal use before changing repository visibility to public.
Delete this file after the repository is made public.

## 1. Security Scan

- [ ] `git log --all --format='%ae'` — no corporate/internal emails in history
- [ ] `grep -r "tkbase\|@tkbase\|shota_nagafuchi" --include="*.sol" --include="*.py" --include="*.md" --include="*.ts"` — no internal references
- [ ] No `.env`, `credentials.json`, or private keys in tracked files
- [ ] `.gitignore` covers `.claude/`, `sessions/`, `scripts/`, `.env`
- [ ] No hardcoded wallet addresses that hold real funds

## 2. Tests

- [ ] `cd contracts && forge test` — all pass (currently 53)
- [ ] `python -m pytest simulation/test_simulation.py -v` — all pass (currently 50)
- [ ] `cd simulation && python halving_check.py` — ALL PASS

## 3. Documentation

- [ ] README.md — core thesis (information double-use prevention) is clear
- [ ] README.md — "Not audited" disclaimer is prominent
- [ ] ECONOMIC_MODEL.md — numbers match Solidity constants and Python constants
- [ ] POSITION_PAPER.md — no internal names or corporate references
- [ ] SECURITY.md — responsible disclosure process documented
- [ ] CONTRIBUTING.md — setup instructions work on a fresh clone
- [ ] LICENSE — Apache-2.0 present at root

## 4. Open Source Files

- [ ] LICENSE exists
- [ ] CODE_OF_CONDUCT.md exists
- [ ] CONTRIBUTING.md exists
- [ ] SECURITY.md exists
- [ ] `.github/workflows/ci.yml` exists and runs Foundry + Python tests
- [ ] `.github/ISSUE_TEMPLATE/` has bug_report.md and feature_request.md
- [ ] `.github/pull_request_template.md` exists

## 5. Build from Scratch

Test that a fresh clone works:

```bash
# In a temp directory
git clone https://github.com/ShotaNagafuchi/sealed-trade-protocol.git /tmp/stp-test
cd /tmp/stp-test

# Solidity
cd contracts
forge install
forge build
forge test
cd ..

# Python
pip install -r simulation/requirements.txt
python -m pytest simulation/test_simulation.py -v

# Clean up
rm -rf /tmp/stp-test
```

## 6. Repository Settings (GitHub)

Before making public:

- [ ] Disable "Allow forking" initially (enable later if desired)
- [ ] Enable branch protection on `main` (require PR, require CI pass)
- [ ] Set up Dependabot for security alerts
- [ ] Add repository topics: `solidity`, `defi`, `bilateral-trade`, `tee`, `ai-agents`
- [ ] Add repository description: "A protocol that prevents the double-use of private information in bilateral trade."

## 7. Final Visual Check

Open these URLs in a browser after making public:

- [ ] Repository main page — README renders correctly
- [ ] Issues tab — templates work (create a test issue, then delete)
- [ ] Actions tab — CI runs on push
- [ ] Security tab — advisories enabled

## Go Public

```
GitHub → Settings → Danger Zone → Change repository visibility → Public
```
