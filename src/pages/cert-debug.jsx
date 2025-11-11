import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, AlertCircle, CheckCircle, Copy, Check } from "lucide-react";
import { dbTest } from "@/api/functions";

export default function CertDebug() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState("");

  const checkCerts = async () => {
    setLoading(true);
    setResult(null);
    try {
      const { data } = await dbTest({ action: "debug_certs" });
      setResult(data);
    } catch (e) {
      setResult({ 
        ok: false, 
        error: e?.response?.data?.error || e?.message || "Error checking certificates" 
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text, key) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 1500);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-7 h-7 text-blue-600" />
        <h1 className="text-2xl font-bold">SSL Certificate Debugger</h1>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-5 w-5 text-blue-600" />
        <AlertTitle className="text-blue-900">What this does</AlertTitle>
        <AlertDescription className="text-blue-800 text-sm">
          This tool reads your SSL certificate secrets from Base44 and shows you:
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>Certificate lengths and format validation</li>
            <li>Whether line breaks are preserved correctly</li>
            <li>First/last lines of each certificate</li>
            <li>Common formatting issues</li>
          </ul>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Check Certificate Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={checkCerts} 
            disabled={loading}
            className="mountain-gradient hover:opacity-90"
          >
            {loading ? "Checking..." : "Analyze Certificates"}
          </Button>

          {result && (
            <div className="mt-6 space-y-4">
              {result.error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{result.error}</AlertDescription>
                </Alert>
              ) : (
                <>
                  {result.ca && (
                    <Card className="border-green-200 bg-green-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          CA Certificate (Server Verification)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div><strong>Length:</strong> {result.ca.length} chars</div>
                        <div><strong>Lines:</strong> {result.ca.line_count}</div>
                        <div><strong>Format:</strong> {result.ca.valid ? "✅ Valid PEM" : "❌ Invalid"}</div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <strong>First line:</strong>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => copyToClipboard(result.ca.first_line, 'ca_first')}
                            >
                              {copied === 'ca_first' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            </Button>
                          </div>
                          <code className="block bg-white px-2 py-1 rounded text-xs">{result.ca.first_line}</code>
                        </div>
                        <div className="space-y-1">
                          <strong>Last line:</strong>
                          <code className="block bg-white px-2 py-1 rounded text-xs">{result.ca.last_line}</code>
                        </div>
                        {result.ca.issues && result.ca.issues.length > 0 && (
                          <Alert variant="destructive" className="mt-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              <strong>Issues:</strong>
                              <ul className="list-disc ml-5 mt-1">
                                {result.ca.issues.map((issue, i) => <li key={i}>{issue}</li>)}
                              </ul>
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {result.cert && (
                    <Card className="border-blue-200 bg-blue-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          {result.cert.valid ? <CheckCircle className="w-4 h-4 text-green-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
                          Client Certificate
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div><strong>Length:</strong> {result.cert.length} chars</div>
                        <div><strong>Lines:</strong> {result.cert.line_count}</div>
                        <div><strong>Format:</strong> {result.cert.valid ? "✅ Valid PEM" : "❌ Invalid"}</div>
                        <div className="space-y-1">
                          <strong>First line:</strong>
                          <code className="block bg-white px-2 py-1 rounded text-xs">{result.cert.first_line}</code>
                        </div>
                        <div className="space-y-1">
                          <strong>Last line:</strong>
                          <code className="block bg-white px-2 py-1 rounded text-xs">{result.cert.last_line}</code>
                        </div>
                        {result.cert.issues && result.cert.issues.length > 0 && (
                          <Alert variant="destructive" className="mt-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              <strong>Issues:</strong>
                              <ul className="list-disc ml-5 mt-1">
                                {result.cert.issues.map((issue, i) => <li key={i}>{issue}</li>)}
                              </ul>
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {result.key && (
                    <Card className="border-purple-200 bg-purple-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          {result.key.valid ? <CheckCircle className="w-4 h-4 text-green-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
                          Client Private Key
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div><strong>Length:</strong> {result.key.length} chars</div>
                        <div><strong>Lines:</strong> {result.key.line_count}</div>
                        <div><strong>Format:</strong> {result.key.valid ? "✅ Valid PEM" : "❌ Invalid"}</div>
                        <div className="space-y-1">
                          <strong>First line:</strong>
                          <code className="block bg-white px-2 py-1 rounded text-xs">{result.key.first_line}</code>
                        </div>
                        <div className="space-y-1">
                          <strong>Last line:</strong>
                          <code className="block bg-white px-2 py-1 rounded text-xs">{result.key.last_line}</code>
                        </div>
                        {result.key.issues && result.key.issues.length > 0 && (
                          <Alert variant="destructive" className="mt-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              <strong>Issues:</strong>
                              <ul className="list-disc ml-5 mt-1">
                                {result.key.issues.map((issue, i) => <li key={i}>{issue}</li>)}
                              </ul>
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {result.recommendation && (
                    <Alert className="bg-amber-50 border-amber-200">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                      <AlertTitle className="text-amber-900">Recommendation</AlertTitle>
                      <AlertDescription className="text-amber-800">
                        {result.recommendation}
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">How to Fix Certificate Issues</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <strong className="text-green-700">✅ Correct Format (with real line breaks):</strong>
            <pre className="bg-slate-900 text-slate-100 rounded p-3 mt-2 text-xs overflow-auto">
{`-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKL0UG+mRfSfMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
BAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX
...more lines...
-----END CERTIFICATE-----`}
            </pre>
          </div>

          <div>
            <strong className="text-red-700">❌ Wrong Format (literal backslash-n):</strong>
            <pre className="bg-slate-900 text-slate-100 rounded p-3 mt-2 text-xs overflow-auto">
{`-----BEGIN CERTIFICATE-----\\nMIIDXTCCAkWgAwIBAgIJAKL0...\\n-----END CERTIFICATE-----`}
            </pre>
          </div>

          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-sm">
              <strong>In Base44 secret inputs:</strong> Even though they appear as single lines, paste the certificates 
              with real line breaks (as they appear in your .pem files). Base44 will preserve the line breaks internally.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}