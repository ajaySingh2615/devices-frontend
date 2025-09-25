"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { userApi, getTokens, User } from "@/lib/api";

export function VerificationBanner() {
  const [user, setUser] = useState<User | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const tokens = getTokens();
    if (!tokens.accessToken) return;
    (async () => {
      try {
        const u = await userApi.getProfile();
        setUser(u);
      } catch {
        // ignore
      }
    })();
  }, []);

  if (hidden) return null;
  if (!user) return null;

  const needsEmail = !user.emailVerifiedAt;
  const needsPhone = !user.phoneVerifiedAt;
  if (!needsEmail && !needsPhone) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-3 text-sm">
        <div>
          {needsEmail && needsPhone && (
            <span>
              Please verify your email address and phone number to secure your
              account.
            </span>
          )}
          {needsEmail && !needsPhone && (
            <span>Please verify your email address.</span>
          )}
          {!needsEmail && needsPhone && (
            <span>Please verify your phone number.</span>
          )}
          <span className="ml-2">
            <Link href="/dashboard" className="underline underline-offset-2">
              Go to Account Settings
            </Link>
          </span>
        </div>
        <button
          className="px-2 py-1 rounded hover:bg-amber-100"
          onClick={() => setHidden(true)}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
