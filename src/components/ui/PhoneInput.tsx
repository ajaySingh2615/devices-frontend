import { forwardRef, useState } from "react";
import { cn } from "@/lib/utils";

interface PhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
  onPhoneChange?: (phone: string, isValid: boolean) => void;
}

// Common international phone prefixes
const COUNTRY_CODES = [
  { code: "+1", name: "US/CA", flag: "🇺🇸" },
  { code: "+44", name: "UK", flag: "🇬🇧" },
  { code: "+33", name: "FR", flag: "🇫🇷" },
  { code: "+49", name: "DE", flag: "🇩🇪" },
  { code: "+81", name: "JP", flag: "🇯🇵" },
  { code: "+86", name: "CN", flag: "🇨🇳" },
  { code: "+91", name: "IN", flag: "🇮🇳" },
  { code: "+61", name: "AU", flag: "🇦🇺" },
  { code: "+55", name: "BR", flag: "🇧🇷" },
  { code: "+7", name: "RU", flag: "🇷🇺" },
];

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    { className, label, error, onPhoneChange, onChange, value = "", ...props },
    ref
  ) => {
    const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
    const [phoneNumber, setPhoneNumber] = useState(
      typeof value === "string" && value.startsWith("+")
        ? value.substring(selectedCountry.code.length)
        : String(value || "")
    );

    const formatPhoneNumber = (input: string) => {
      // Remove all non-digits
      const digits = input.replace(/\D/g, "");

      // Format based on length (assuming US format for demo)
      if (digits.length <= 3) {
        return digits;
      } else if (digits.length <= 6) {
        return `${digits.slice(0, 3)}-${digits.slice(3)}`;
      } else {
        return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(
          6,
          10
        )}`;
      }
    };

    const validatePhoneNumber = (phone: string) => {
      const digits = phone.replace(/\D/g, "");
      return digits.length >= 10 && digits.length <= 15;
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      const formatted = formatPhoneNumber(input);
      const fullPhone = selectedCountry.code + formatted.replace(/\D/g, "");
      const isValid = validatePhoneNumber(formatted);

      setPhoneNumber(formatted);

      // Call parent onChange with full international number
      const syntheticEvent = {
        ...e,
        target: { ...e.target, value: fullPhone },
      };
      onChange?.(syntheticEvent);
      onPhoneChange?.(fullPhone, isValid);
    };

    const handleCountryChange = (country: (typeof COUNTRY_CODES)[0]) => {
      setSelectedCountry(country);
      const fullPhone = country.code + String(phoneNumber).replace(/\D/g, "");
      const isValid = validatePhoneNumber(String(phoneNumber));
      onPhoneChange?.(fullPhone, isValid);
    };

    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-foreground">{label}</label>
        )}

        <div className="flex gap-2">
          {/* Country Code Selector */}
          <div className="relative">
            <select
              value={selectedCountry.code}
              onChange={(e) => {
                const country = COUNTRY_CODES.find(
                  (c) => c.code === e.target.value
                );
                if (country) handleCountryChange(country);
              }}
              className={cn(
                "flex h-12 w-20 rounded-md border border-input bg-surface px-2 py-2 text-sm",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
            >
              {COUNTRY_CODES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.flag} {country.code}
                </option>
              ))}
            </select>
          </div>

          {/* Phone Number Input */}
          <input
            type="tel"
            className={cn(
              "flex h-12 flex-1 rounded-md border border-input bg-surface px-3 py-2 text-sm",
              "placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-error focus:ring-error",
              className
            )}
            value={phoneNumber}
            onChange={handlePhoneChange}
            placeholder="123-456-7890"
            ref={ref}
            {...props}
          />
        </div>

        {/* Phone format hint */}
        <div className="text-xs text-muted-foreground">
          Format: {selectedCountry.code} (123) 456-7890
        </div>

        {error && <p className="text-sm text-error">{error}</p>}
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";
