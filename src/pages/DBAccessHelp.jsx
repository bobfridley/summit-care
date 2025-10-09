
import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Copy, Check, Database, Shield, Globe } from "lucide-react";
import { egressIp } from "@/api/functions";
import { db } from "@/api/functions";

export default function DBAccessHelp() {
  const [ip, setIp] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const [fwCopied, setFwCopied] = useState(false);
  const [pinging, setPinging] = useState(false);
  const [pingResult, setPingResult] = useState(null);
  const [pingError, setPingError] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await egressIp();
        if (!mounted) return;
        if (data?.ok && data?.ip) {
          setIp(data.ip);
        } else {
          setError(data?.error || "Unable to determine egress IP");
        }
      } catch (e) {
        setError("Unable to determine egress IP");
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const sql = useMemo(() => {
    const EGRESS = ip || "YOUR_EGRESS_IP";
    const DBNAME = "YOUR_DATABASE_NAME";
    const USER = "u273139992_admin";
    const PASS = "STRONG_PASSWORD";
    return `-- MySQL GRANT statements for SummitCare app access over SSL
-- Replace placeholders before running on your MySQL server:
--   - ${DBNAME}  -> your DB name (same as MYSQL_DATABASE)
--   - ${PASS}    -> your user's password
--   - ${EGRESS}  -> the current caller IP (shown below)

-- Exact-IP user (recommended when provider enforces IP allowlists)
CREATE USER '${USER}'@'${EGRESS}' IDENTIFIED BY '${PASS}';
GRANT USAGE ON *.* TO '${USER}'@'${EGRESS}' REQUIRE SSL;

-- Minimal privileges (read-only; matches our SELECT-only function)
GRANT SELECT ON \`${DBNAME}\`.* TO '${USER}'@'${EGRESS}';

-- OR broader privileges if your app will write data too (uncomment as needed):
-- GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX
--   ON \`${DBNAME}\`.* TO '${USER}'@'${EGRESS}';

FLUSH PRIVILEGES;

-- (Optional) If the user already exists and you only need to enforce SSL + grant:
-- ALTER USER '${USER}'@'${EGRESS}' REQUIRE SSL;
-- GRANT SELECT ON \`${DBNAME}\`.* TO '${USER}'@'${EGRESS}';
-- FLUSH PRIVILEGES;

-- (Optional) Allow from any host (use only if your provider/firewall already restricts by IP)
-- CREATE USER '${USER}'@'%' IDENTIFIED BY '${PASS}';
-- GRANT USAGE ON *.* TO '${USER}'@'%' REQUIRE SSL;
-- GRANT SELECT ON \`${DBNAME}\`.* TO '${USER}'@'%';
-- FLUSH PRIVILEGES;

-- (Optional compatibility) For older MySQL/MariaDB that require mysql_native_password:
-- ALTER USER '${USER}'@'${EGRESS}'
--   IDENTIFIED WITH mysql_native_password BY '${PASS}';

-- Verify:
-- SHOW GRANTS FOR '${USER}'@'${EGRESS}';`;
  }, [ip]);

  const firewall = useMemo(() => {
    const EGRESS = ip || "YOUR_EGRESS_IP";
    return `# UFW (Ubuntu/Debian)
sudo ufw allow from ${EGRESS} to any port 3306 proto tcp

# firewalld (RHEL/CentOS/Alma)
sudo firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="${EGRESS}/32" port protocol="tcp" port="3306" accept'
sudo firewall-cmd --reload

# iptables (legacy)
sudo iptables -I INPUT -p tcp -s ${EGRESS} --dport 3306 -j ACCEPT
sudo iptables-save | sudo tee /etc/iptables/rules.v4 > /dev/null`;
  }, [ip]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleFwCopy = async () => {
    await navigator.clipboard.writeText(firewall);
    setFwCopied(true);
    setTimeout(() => setFwCopied(false), 1500);
  };

  const testDb = async () => {
    setPinging(true);
    setPingError("");
    setPingResult(null);
    try {
      const { data } = await db({ action: "ping" });
      if (data?.ok) {
        setPingResult(data?.result || { ok: 1 });
      } else {
        setPingError(data?.error || "Unknown error");
      }
    } catch (e) {
      setPingError(e?.response?.data?.error || e?.message || "Error testing DB");
    } finally {
      setPinging(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <Database className="w-7 h-7 text-blue-600" />
        <h1 className="text-2xl font-bold">Database Access Helper</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Egress IP</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-gray-500">Detecting current egress IP…</div>
          ) : error ? (
            <div className="flex items-start gap-2 text-red-600">
              <AlertCircle className="w-5 h-5 mt-0.5" />
              <span>{error}</span>
            </div>
          ) : (
            <div className="text-gray-700">
              Current caller IP: <span className="font-mono font-semibold">{ip}</span>
              <div className="text-sm text-gray-500 mt-1">
                If your DB requires IP allowlisting, add this IP. Egress IPs may change over time on serverless infra.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            <CardTitle>Live DB Connection Test</CardTitle>
          </div>
          <Button onClick={testDb} variant="outline" disabled={pinging}>
            {pinging ? "Testing…" : "Test connection"}
          </Button>
        </CardHeader>
        <CardContent>
          {pingError ? (
            <div className="flex items-start gap-2 text-red-600">
              <AlertCircle className="w-5 h-5 mt-0.5" />
              <span className="whitespace-pre-wrap">{String(pingError)}</span>
            </div>
          ) : pingResult ? (
            <div className="text-sm text-gray-700">
              Connection OK
              <pre className="bg-slate-900 text-slate-100 rounded-lg p-3 mt-2 overflow-auto">
                <code>{JSON.stringify(pingResult, null, 2)}</code>
              </pre>
            </div>
          ) : (
            <div className="text-gray-500 text-sm">
              Uses functions/db → action: "ping" to verify connectivity with your current environment vars.
            </div>
          )}
          <div className="text-xs text-gray-500 mt-3">
            Tip: If you see "UnknownIssuer", set MYSQL_SSL_CA to your server CA, or temporarily set MYSQL_SSL_MODE=insecure or MYSQL_SSL_REJECT_UNAUTHORIZED=false in app settings.
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader className="flex-row justify-between items-center">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            <CardTitle>Firewall Rules (Hostinger VPS)</CardTitle>
          </div>
          <Button onClick={handleFwCopy} variant="outline" className="gap-2">
            {fwCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {fwCopied ? "Copied" : "Copy commands"}
          </Button>
        </CardHeader>
        <CardContent>
          <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 overflow-auto text-sm">
            <code>{firewall}</code>
          </pre>
          <p className="text-sm text-gray-600 mt-3">
            Note: If egress IPs change, re-run these commands with the new IP. Keep MySQL bound to SSL and use strong passwords.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row justify-between items-center">
          <CardTitle>GRANT statements (copy, then replace placeholders)</CardTitle>
          <Button onClick={handleCopy} variant="outline" className="gap-2">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied" : "Copy SQL"}
          </Button>
        </CardHeader>
        <CardContent>
          <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 overflow-auto text-sm">
            <code>{sql}</code>
          </pre>
          <p className="text-sm text-gray-600 mt-3">
            Tip: For TLS errors with self-signed/hosted CA, set MYSQL_SSL_CA in app settings; otherwise temporarily set MYSQL_SSL_MODE=insecure.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
