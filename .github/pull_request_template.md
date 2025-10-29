## 🧩 Summary

Provide a short overview of what this PR changes and why.
_(Example: “Hardened SSH deployment workflow with new sanity check and host key fallback.”)_

---

## ✅ Changes Made

- [ ] Added new configuration or secret variables
- [ ] Updated GitHub Actions or CI workflows
- [ ] Improved error handling or fallback logic
- [ ] Adjusted documentation or environment setup
- [ ] Refactored code or dependencies
- [ ] Other (please describe):

---

## 🧠 Context & Motivation

Explain the reason for the change.  
_(Example: “Frequent host key verification errors in production deploys — this adds automatic host key scanning and a pre-deploy SSH sanity check.”)_

---

## 🧪 Testing

Describe how you verified the changes locally or via CI.

- [ ] Ran `pnpm lint && pnpm test`
- [ ] Successfully deployed to staging
- [ ] Confirmed SSH connectivity via sanity check
- [ ] Verified PM2 reload/start behavior

---

## ⚙️ Environment Notes

| Secret / Variable | Required | Description                         |
| ----------------- | -------- | ----------------------------------- |
| `DEPLOY_USER`     | ✅       | SSH username on remote host         |
| `DEPLOY_HOST`     | ✅       | Remote hostname or IP               |
| `APP_DIR`         | ✅       | Target app directory on remote host |
| `SSH_PRIVATE_KEY` | ✅       | Base64-encoded private key          |
| `SSH_PORT`        | ⚙️       | Optional (defaults to 22)           |
| `KNOWN_HOSTS`     | ⚙️       | Optional pinned host keys           |

---

## 📸 Screenshots / Logs (Optional)

_Paste relevant terminal output, screenshots, or deployment logs._

---

## 🚀 Next Steps

- [ ] Confirm all secrets are configured in repo → **Settings › Secrets and variables › Actions**
- [ ] Trigger `Deploy to Staging`
- [ ] If successful, merge to `main` for production deploy

---

**Reviewer checklist:**

- [ ] CI checks pass
- [ ] Security-sensitive data handled safely
- [ ] Changes scoped and reversible
- [ ] Documentation or comments updated if needed
