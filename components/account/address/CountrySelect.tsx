"use client";

import { useEffect, useState, type ComponentType } from "react";
import { CountrySelect as RawCountrySelect, GetCountries } from "react-country-state-city";
import "react-country-state-city/dist/react-country-state-city.css";

type Country = Awaited<ReturnType<typeof GetCountries>>[number];

// The package extends InputHTMLAttributes, which pollutes onChange/defaultValue.
// Re-type it to the props we actually use.
const PackageCountrySelect = RawCountrySelect as unknown as ComponentType<{
  defaultValue?: Country;
  onChange?: (c: Country) => void;
  placeHolder?: string;
  showFlag?: boolean;
  containerClassName?: string;
  inputClassName?: string;
}>;

/**
 * Country picker backed by the `react-country-state-city` package's CountrySelect
 * (full world list, flags, search, offline data). Emits { code: iso2, name }.
 */
export default function CountrySelect({
  value,
  onChange,
  invalid,
  id,
}: {
  value: string; // ISO-2 country code
  onChange: (v: { code: string; name: string }) => void;
  invalid?: boolean;
  id?: string;
}) {
  // Capture the initial value once — the package component is uncontrolled (defaultValue at mount).
  const [initialIso] = useState(value);
  const [defaultCountry, setDefaultCountry] = useState<Country | undefined>(undefined);
  const [ready, setReady] = useState(!initialIso);

  useEffect(() => {
    if (!initialIso) return;
    let active = true;
    GetCountries().then((list) => {
      if (!active) return;
      setDefaultCountry(list.find((c) => c.iso2?.toUpperCase() === initialIso.toUpperCase()));
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, [initialIso]);

  if (!ready) {
    return <div className="w-full rounded-lg border border-[#E2E2E2] px-3 py-[9px] text-sm text-[#9a958c] bg-white">Loading…</div>;
  }

  return (
    <div id={id} className={`account-country ${invalid ? "account-country--invalid" : ""}`}>
      <PackageCountrySelect
        defaultValue={defaultCountry}
        onChange={(c) => onChange({ code: c.iso2, name: c.name })}
        placeHolder="Select country"
        showFlag
        containerClassName="account-country-container"
        inputClassName="account-country-input"
      />
    </div>
  );
}
