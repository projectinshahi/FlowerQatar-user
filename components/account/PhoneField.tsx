"use client";

import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

/**
 * International phone input (Airbnb/Stripe style):
 *   [ flag ▾ country dropdown ] [ national number field ]
 *
 * - The calling code is NOT baked into the text field, so the number is fully
 *   editable/backspaceable and never "snaps back" to a fixed prefix.
 * - Change the country (and its calling code) via the searchable flag dropdown.
 * - `onChange` always emits E.164 (e.g. "+97430123456") — we store only that.
 */
export default function PhoneField({
  value,
  onChange,
  id,
  invalid,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  id?: string;
  invalid?: boolean;
  disabled?: boolean;
}) {
  return (
    <div
      className={`account-phone flex items-center gap-1 rounded-lg border px-3 py-2.5 bg-white transition-colors focus-within:border-primary ${
        invalid ? "border-red-400" : "border-[#E2E2E2]"
      } ${disabled ? "opacity-60" : ""}`}
    >
      <PhoneInput
        id={id}
        defaultCountry="QA"
        value={value || undefined}
        onChange={(v) => onChange(v || "")}
        disabled={disabled}
        limitMaxLength
        aria-invalid={invalid || undefined}
        placeholder="Phone number"
        numberInputProps={{
          className: "flex-1 min-w-0 outline-none bg-transparent text-sm text-primary placeholder:text-[#B7B2A8]",
        }}
      />
    </div>
  );
}
