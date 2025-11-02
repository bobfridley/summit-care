# ===== 1) Shell/Path Diagnostic =====
echo -e "\n🧭 Shell startup diagnostic:\n"
echo "Login shell:   $SHELL"
echo "Current shell: $(ps -p $$ -o comm=)"
echo
echo "PATH order:"
echo "$PATH" | tr ':' '\n' | nl
echo
echo "bash location: $(which bash)"
echo "bash version:  $(bash --version | head -n 1)"
echo
for f in ~/.zshrc ~/.bash_profile ~/.bashrc ~/.profile; do
  if [ -f "$f" ]; then
    if grep -q "PATH=" "$f"; then echo "✅ $f modifies PATH"; else echo "⚪ $f (no PATH export)"; fi
  fi
done
echo

# ===== 2) Fix accidental *.tsx-lower files =====
echo "🔍 Looking for files to fix (src/pages/**/*.tsx-lower)…"
find src/pages -type f -name '*.tsx-lower' | nl
echo

read -r -p "Apply rename *.tsx-lower → *.tsx now? [y/N] " ans
if [[ "$ans" =~ ^[Yy]$ ]]; then
  echo "🚀 Renaming…"
  find src/pages -type f -name '*.tsx-lower' | while read -r f; do
    mv "$f" "${f%-lower}"
    echo "  ✓ ${f} -> ${f%-lower}"
  done
  echo "✅ Done."
else
  echo "ℹ️ Skipped. No changes applied."
fi

echo -e "\n🧪 Current .tsx pages in src/pages (top 50):"
find src/pages -type f -name '*.tsx' | head -n 50
echo -e "\n🎉 All set. Next: build locally to verify (pnpm build), then commit & push."
