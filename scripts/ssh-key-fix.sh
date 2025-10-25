# === SSH key fix helper ===
if [ -d "$HOME/.ssh" ]; then
  echo "🔧 Fixing permissions in ~/.ssh for user: $USER"
  sudo chown -R "$USER":staff "$HOME/.ssh"
  chmod 700 "$HOME/.ssh"
  [ -f "$HOME/.ssh/id_ed25519" ] && chmod 600 "$HOME/.ssh/id_ed25519"
  [ -f "$HOME/.ssh/id_rsa" ] && chmod 600 "$HOME/.ssh/id_rsa"
  [ -f "$HOME/.ssh/id_ed25519.pub" ] && chmod 644 "$HOME/.ssh/id_ed25519.pub"
  [ -f "$HOME/.ssh/id_rsa.pub" ] && chmod 644 "$HOME/.ssh/id_rsa.pub"
  echo "✅ Permissions repaired."
else
  echo "⚠️  No ~/.ssh directory found — nothing to fix."
fi

# restart the SSH agent and add key to Keychain if found
if [ -f "$HOME/.ssh/id_ed25519" ]; then
  eval "$(ssh-agent -s)" >/dev/null
  ssh-add --apple-use-keychain "$HOME/.ssh/id_ed25519" 2>/dev/null || ssh-add -K "$HOME/.ssh/id_ed25519"
  echo "🗝️  id_ed25519 key added to SSH agent."
fi
