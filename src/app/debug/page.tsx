"use client";

import { useState } from "react";
import { getTokens, userApi } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface DebugInfo {
  hasAccessToken?: boolean;
  hasRefreshToken?: boolean;
  accessTokenLength?: number;
  accessTokenStart?: string;
  localStorage?: {
    accessToken: string;
    refreshToken: string;
  };
  apiTest?: {
    success: boolean;
    user?: any;
    error?: string;
    status?: number;
    statusText?: string;
  };
}

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);

  const checkTokens = () => {
    const tokens = getTokens();
    setDebugInfo({
      hasAccessToken: !!tokens.accessToken,
      hasRefreshToken: !!tokens.refreshToken,
      accessTokenLength: tokens.accessToken?.length || 0,
      accessTokenStart:
        tokens.accessToken?.substring(0, 20) + "..." || "No token",
      localStorage: {
        accessToken:
          localStorage.getItem("accessToken")?.substring(0, 20) + "..." ||
          "No token",
        refreshToken:
          localStorage.getItem("refreshToken")?.substring(0, 20) + "..." ||
          "No token",
      },
    });
  };

  const testApiCall = async () => {
    try {
      console.log("Testing API call...");
      const response = await userApi.getProfile();
      setDebugInfo((prev: DebugInfo | null) => ({
        ...prev,
        apiTest: {
          success: true,
          user: response,
        },
      }));
    } catch (error: any) {
      console.error("API test failed:", error);
      setDebugInfo((prev: DebugInfo | null) => ({
        ...prev,
        apiTest: {
          success: false,
          error: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
        },
      }));
    }
  };

  return (
    <div className="min-h-screen bg-background-secondary p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug Page</h1>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Token Debug</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={checkTokens}>Check Tokens</Button>

              {debugInfo && (
                <div className="bg-background-tertiary p-4 rounded-lg">
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={testApiCall}>Test /users/me API</Button>

              <div className="text-sm text-foreground-muted">
                This will test if the API call works with current tokens
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
