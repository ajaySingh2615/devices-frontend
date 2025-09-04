import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  error?: string;
  label?: string;
  disabled?: boolean;
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  error,
  label,
  disabled = false,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  // Initialize input refs
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus();
    }
  }, [disabled]);

  // Handle input change
  const handleChange = (index: number, inputValue: string) => {
    if (disabled) return;

    // Only allow single digits
    const digit = inputValue.replace(/\D/g, "").slice(-1);

    // Update the value
    const newValue = value.split("");
    newValue[index] = digit;
    const updatedValue = newValue.join("").slice(0, length);

    onChange(updatedValue);

    // Move to next input if digit entered
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Call onComplete if all fields filled
    if (updatedValue.length === length) {
      onComplete?.(updatedValue);
    }
  };

  // Handle key events
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case "Backspace":
        e.preventDefault();
        if (value[index]) {
          // Clear current field
          const newValue = value.split("");
          newValue[index] = "";
          onChange(newValue.join(""));
        } else if (index > 0) {
          // Move to previous field and clear it
          const newValue = value.split("");
          newValue[index - 1] = "";
          onChange(newValue.join(""));
          inputRefs.current[index - 1]?.focus();
        }
        break;

      case "ArrowLeft":
        e.preventDefault();
        if (index > 0) {
          inputRefs.current[index - 1]?.focus();
        }
        break;

      case "ArrowRight":
        e.preventDefault();
        if (index < length - 1) {
          inputRefs.current[index + 1]?.focus();
        }
        break;

      case "Delete":
        e.preventDefault();
        const newValue = value.split("");
        newValue[index] = "";
        onChange(newValue.join(""));
        break;
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    if (disabled) return;

    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain");
    const digits = pastedData.replace(/\D/g, "").slice(0, length);

    onChange(digits);

    // Focus the next empty field or last field
    const nextIndex = Math.min(digits.length, length - 1);
    inputRefs.current[nextIndex]?.focus();

    if (digits.length === length) {
      onComplete?.(digits);
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-foreground">{label}</label>
      )}

      <div className="flex gap-2 justify-center">
        {Array.from({ length }, (_, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[index] || ""}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={() => setFocusedIndex(index)}
            onBlur={() => setFocusedIndex(null)}
            disabled={disabled}
            className={cn(
              "h-12 w-12 rounded-md border border-input bg-surface text-center text-lg font-mono",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-error focus:ring-error",
              focusedIndex === index && "ring-2 ring-ring ring-offset-2",
              value[index] && "border-primary"
            )}
            aria-label={`Digit ${index + 1}`}
          />
        ))}
      </div>

      {/* Helper text */}
      <div className="text-center text-xs text-muted-foreground">
        Enter the {length}-digit code sent to your phone
      </div>

      {error && <p className="text-sm text-error text-center">{error}</p>}
    </div>
  );
}
