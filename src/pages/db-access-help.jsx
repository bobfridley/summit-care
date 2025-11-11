import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Copy, Check, Database, Shield, Globe, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { egressIp } from "@/api/functions";
import { dbTest } from "@/api/functions";

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
    const DBNAME = "summitcare";
    const USER = "summitcare_base44";
    const PASS = "YOUR_STRONG_PASSWORD";
    return `-- MySQL GRANT statements for SummitCare app access
-- Database: ${DBNAME}
-- User: ${USER}
-- ⚠️  CRITICAL: Replace YOUR_STRONG_PASSWORD with a strong password before running!
-- ⚠️  This password MUST match the MYSQL_PASSWORD in your Base44 app settings.
-- ⚠️  Generate a strong password: openssl rand -base64 32

-- Option 1: Allow from any IP (recommended for serverless with changing IPs)
-- This is more flexible and works with Base44's dynamic egress IPs

DROP USER IF EXISTS '${USER}'@'%';
CREATE USER '${USER}'@'%' IDENTIFIED BY '${PASS}';
GRANT SELECT, INSERT, UPDATE, DELETE ON \`${DBNAME}\`.* TO '${USER}'@'%';
FLUSH PRIVILEGES;

-- To add SSL requirement (optional, after testing):
-- ALTER USER '${USER}'@'%' REQUIRE SSL;
-- FLUSH PRIVILEGES;

-- Option 2: Allow from specific egress IP only (more restrictive)
-- Current egress IP detected: ${EGRESS}
-- Note: This IP may change over time on serverless infrastructure

DROP USER IF EXISTS '${USER}'@'${EGRESS}';
CREATE USER '${USER}'@'${EGRESS}' IDENTIFIED BY '${PASS}';
GRANT SELECT, INSERT, UPDATE, DELETE ON \`${DBNAME}\`.* TO '${USER}'@'${EGRESS}';
FLUSH PRIVILEGES;

-- To add SSL requirement (optional, after testing):
-- ALTER USER '${USER}'@'${EGRESS}' REQUIRE SSL;
-- FLUSH PRIVILEGES;

-- Verify grants:
SHOW GRANTS FOR '${USER}'@'%';
-- or
SHOW GRANTS FOR '${USER}'@'${EGRESS}';

-- Note: For production, always use SSL (REQUIRE SSL) and strong passwords`;
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

  const testDb = async (useSSL = true) => {
    setPinging(true);
    setPingError("");
    setPingResult(null);
    try {
      const { data } = await dbTest({ action: "ping", use_ssl: useSSL });
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

  const DBNAME = "summitcare";
  const USER = "summitcare_base44";

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <Database className="w-7 h-7 text-blue-600" />
        <h1 className="text-2xl font-bold">Database Access Helper</h1>
      </div>

      <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200">
        <AlertTriangle className="h-5 w-5 text-red-600" />
        <AlertTitle className="text-red-900 font-bold">Security Warning</AlertTitle>
        <AlertDescription className="text-red-800 space-y-2">
          <p className="font-semibold">The SQL below contains placeholder passwords that MUST be replaced before use!</p>
          <ul className="list-disc ml-5 space-y-1 text-sm">
            <li>Replace <code className="bg-red-100 px-1.5 py-0.5 rounded font-mono text-red-900">YOUR_STRONG_PASSWORD</code> with a secure password</li>
            <li>Generate strong passwords: <code className="bg-red-100 px-1.5 py-0.5 rounded font-mono text-red-900">openssl rand -base64 32</code></li>
            <li>The password must match <code className="bg-red-100 px-1.5 py-0.5 rounded font-mono text-red-900">MYSQL_PASSWORD</code> in Base44 app settings</li>
            <li>Never commit passwords to version control or share them publicly</li>
          </ul>
        </AlertDescription>
      </Alert>

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
                If your DB requires IP allowlisting, add this IP. Note: Egress IPs may change over time on serverless infrastructure.
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
          <div className="flex gap-2">
            <Button onClick={() => testDb(false)} variant="outline" disabled={pinging} className="bg-yellow-50 hover:bg-yellow-100">
              {pinging ? "Testing…" : "Test WITHOUT SSL"}
            </Button>
            <Button onClick={() => testDb(true)} variant="outline" disabled={pinging}>
              {pinging ? "Testing…" : "Test with SSL"}
            </Button>
          </div>
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
              Uses functions/dbTest → action: "ping" to verify connectivity with your current environment vars.
            </div>
          )}
          <div className="text-xs text-gray-500 mt-3">
            <strong>Test Strategy:</strong>
            <ul className="list-disc ml-5 mt-1">
              <li><strong>WITHOUT SSL first:</strong> Tests if Base44 can reach your MySQL server at all (network/firewall check)</li>
              <li><strong>With SSL:</strong> Tests if the SSL certificates are valid and properly configured</li>
            </ul>
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
            Note: If using '{USER}'@'%', simply run: sudo ufw allow 3306/tcp
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row justify-between items-center">
          <div className="space-y-1">
            <CardTitle>MySQL GRANT Statements</CardTitle>
            <p className="text-sm text-red-600 font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Replace YOUR_STRONG_PASSWORD before running!
            </p>
          </div>
          <Button onClick={handleCopy} variant="outline" className="gap-2">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied" : "Copy SQL"}
          </Button>
        </CardHeader>
        <CardContent>
          <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 overflow-auto text-sm">
            <code>{sql}</code>
          </pre>
          <Alert className="mt-4 bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-900">Before Running This SQL</AlertTitle>
            <AlertDescription className="text-amber-800 text-sm space-y-2">
              <ol className="list-decimal ml-5 space-y-1">
                <li>Generate a strong password: <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">openssl rand -base64 32</code></li>
                <li>Replace <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">YOUR_STRONG_PASSWORD</code> in the SQL above</li>
                <li>Save that same password to Base44 → Settings → Environment Variables → <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">MYSQL_PASSWORD</code></li>
                <li>Run the modified SQL on your MySQL server</li>
                <li>Test connection using the button above</li>
              </ol>
              <p className="mt-2 font-semibold">Recommendation: Use Option 1 (user@'%') for serverless where IPs change frequently.</p>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}