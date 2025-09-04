import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { authApi, setTokens } from "@/lib/api";

declare global {
  interface Window {
    google: any;
  }
}

interface GoogleAuthOptions {
  onSuccess: () => void;
  onError?: (error: string) => void;
}

export const useGoogleAuth = ({ onSuccess, onError }: GoogleAuthOptions) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);

  useEffect(() => {
    // Check if Google Identity Services is loaded
    const checkGoogleLoaded = () => {
      if (window.google?.accounts?.id) {
        setIsGoogleLoaded(true);
        initializeGoogle();
      } else {
        // Retry after a short delay
        setTimeout(checkGoogleLoaded, 100);
      }
    };

    checkGoogleLoaded();
  }, []);

  const initializeGoogle = () => {
    if (!window.google?.accounts?.id) return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error("Google Client ID not found in environment variables");
      return;
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
      use_fedcm_for_prompt: true, // Enable FedCM for better compatibility
    });
  };

  const handleGoogleResponse = async (response: any) => {
    setIsLoading(true);
    try {
      const { credential } = response;

      // Send the ID token to our backend
      const authResponse = await authApi.googleAuth({
        idToken: credential,
      });

      // Store tokens and redirect
      setTokens(authResponse.accessToken, authResponse.refreshToken);
      toast.success("Successfully signed in with Google!");
      onSuccess();
    } catch (error: any) {
      console.error("Google authentication failed:", error);
      const errorMessage =
        error.response?.data?.message || "Google sign-in failed";
      toast.error(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = () => {
    if (!isGoogleLoaded) {
      toast.error("Google Sign-In is still loading...");
      return;
    }

    if (!window.google?.accounts?.id) {
      toast.error("Google Sign-In is not available");
      return;
    }

    // Create a temporary button element and trigger it
    const tempButtonId = "temp-google-signin-" + Date.now();
    const tempDiv = document.createElement("div");
    tempDiv.id = tempButtonId;
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    tempDiv.style.visibility = "hidden";
    document.body.appendChild(tempDiv);

    try {
      window.google.accounts.id.renderButton(tempDiv, {
        theme: "outline",
        size: "large",
        width: 300,
        text: "continue_with",
        shape: "rectangular",
      });

      // Programmatically click the button
      const googleButton = tempDiv.querySelector(
        "div[role='button']"
      ) as HTMLElement;
      if (googleButton) {
        googleButton.click();
      } else {
        // Fallback: try the prompt method
        window.google.accounts.id.prompt();
      }
    } catch (error) {
      console.error("Google Sign-In error:", error);
      toast.error("Failed to initialize Google Sign-In");
    } finally {
      // Clean up the temporary element after a delay
      setTimeout(() => {
        if (document.body.contains(tempDiv)) {
          document.body.removeChild(tempDiv);
        }
      }, 1000);
    }
  };

  const renderGoogleButton = (elementId: string) => {
    if (!isGoogleLoaded || !window.google?.accounts?.id) return;

    const element = document.getElementById(elementId);
    if (!element) return;

    try {
      window.google.accounts.id.renderButton(element, {
        theme: "outline",
        size: "large",
        width: 300,
        text: "continue_with",
        shape: "rectangular",
      });
    } catch (error) {
      console.error("Google button render failed:", error);
      // Fallback: show custom message
      element.innerHTML = `
        <div style="
          border: 2px dashed #e5e7eb; 
          padding: 16px; 
          text-align: center; 
          border-radius: 8px;
          color: #6b7280;
          background: #f9fafb;
        ">
          <p>Google Sign-In temporarily unavailable</p>
          <p style="font-size: 12px; margin-top: 8px;">Check Google Cloud Console configuration</p>
        </div>
      `;
    }
  };

  return {
    signInWithGoogle,
    renderGoogleButton,
    isLoading,
    isGoogleLoaded,
  };
};
