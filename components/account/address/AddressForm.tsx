"use client";

import { useMemo, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { addressSchema, type Address, type AddressInput } from "@/lib/validations/address";
import { postalExample, isPostalRequired } from "@/lib/postal";
import CountrySelect from "./CountrySelect";
import AddressLabelDialog from "./AddressLabelDialog";
import LabelGlyph from "./LabelGlyph";

type FormValues = {
  label: string;
  countryCode: string;
  countryName: string;
  stateCode: string;
  stateName: string;
  city: string;
  postalCode: string;
  addressLine1: string;
  addressLine2: string;
  isDefault: boolean;
};

const DEFAULT_LABELS = ["Home", "Work"];
const labelCls = "block text-[10px] uppercase tracking-[0.15em] text-[#8A8A8A] mb-1.5";
const inputCls = (invalid?: boolean) =>
  `w-full rounded-lg border text-sm py-2.5 px-3 outline-none bg-white transition-colors ${
    invalid ? "border-red-400" : "border-[#E2E2E2] focus:border-primary"
  }`;

export default function AddressForm({
  initial,
  saving,
  serverError,
  onSubmit,
}: {
  initial: Address | null;
  saving: boolean;
  serverError?: string | null;
  onSubmit: (data: AddressInput) => void;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(addressSchema) as unknown as Resolver<FormValues>,
    defaultValues: initial
      ? {
          label: initial.label,
          countryCode: initial.countryCode,
          countryName: initial.countryName,
          stateCode: initial.stateCode ?? "",
          stateName: initial.stateName ?? "",
          city: initial.city,
          postalCode: initial.postalCode ?? "",
          addressLine1: initial.addressLine1,
          addressLine2: initial.addressLine2 ?? "",
          isDefault: initial.isDefault,
        }
      : {
          label: "Home",
          countryCode: "",
          countryName: "",
          stateCode: "",
          stateName: "",
          city: "",
          postalCode: "",
          addressLine1: "",
          addressLine2: "",
          isDefault: false,
        },
  });

  const countryCode = watch("countryCode");
  const label = watch("label");
  const isDefault = watch("isDefault");

  const [labelDialog, setLabelDialog] = useState(false);
  const [customLabels, setCustomLabels] = useState<string[]>(() =>
    initial && !DEFAULT_LABELS.some((d) => d.toLowerCase() === initial.label.toLowerCase()) ? [initial.label] : []
  );
  const allLabels = useMemo(() => [...DEFAULT_LABELS, ...customLabels], [customLabels]);

  const set = (name: keyof FormValues, value: string | boolean) =>
    setValue(name, value as never, { shouldValidate: true, shouldDirty: true });

  const submit = (values: FormValues) => onSubmit(values as AddressInput);

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      {serverError && <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-500 text-xs">{serverError}</div>}

      {/* Label cards */}
      <div>
        <label className={labelCls}>Address Label</label>
        <div className="flex flex-wrap gap-2">
          {allLabels.map((l) => {
            const selected = label === l;
            return (
              <button
                key={l}
                type="button"
                onClick={() => set("label", l)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-colors ${
                  selected ? "border-primary bg-primary/5 text-primary" : "border-[#E2E2E2] text-[#666] hover:border-primary/50"
                }`}
              >
                <LabelGlyph label={l} size={15} /> {l}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setLabelDialog(true)}
            aria-label="Add custom label"
            className="inline-flex items-center justify-center w-11 h-11 rounded-xl border border-dashed border-[#CFC8BC] text-[#8A8A8A] hover:border-primary hover:text-primary transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>
        {errors.label && <p className="text-[11px] text-red-500 mt-1">{errors.label.message}</p>}
      </div>

      {/* Country (searchable, all countries) */}
      <div>
        <label className={labelCls}>Country *</label>
        <CountrySelect
          value={countryCode}
          invalid={!!errors.countryName || !!errors.countryCode}
          onChange={({ code, name }) => {
            set("countryCode", code);
            set("countryName", name);
          }}
        />
        {(errors.countryName || errors.countryCode) && <p className="text-[11px] text-red-500 mt-1">Country is required</p>}
      </div>

      {/* State / City — typed manually */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>State / Province</label>
          <input {...register("stateName")} autoComplete="address-level1" aria-invalid={!!errors.stateName} placeholder="State / Province" className={inputCls(!!errors.stateName)} />
          {errors.stateName && <p className="text-[11px] text-red-500 mt-1">{errors.stateName.message}</p>}
        </div>
        <div>
          <label className={labelCls}>City *</label>
          <input {...register("city")} autoComplete="address-level2" aria-invalid={!!errors.city} placeholder="City" className={inputCls(!!errors.city)} />
          {errors.city && <p className="text-[11px] text-red-500 mt-1">{errors.city.message}</p>}
        </div>
      </div>

      {/* Postal */}
      <div className="sm:w-1/2 sm:pr-2">
        <label className={labelCls}>Postal Code{isPostalRequired(countryCode) ? " *" : " (optional)"}</label>
        <input {...register("postalCode")} autoComplete="postal-code" aria-invalid={!!errors.postalCode} placeholder={postalExample(countryCode)} className={inputCls(!!errors.postalCode)} />
        {errors.postalCode && <p className="text-[11px] text-red-500 mt-1">{errors.postalCode.message}</p>}
      </div>

      {/* Address lines */}
      <div>
        <label className={labelCls}>Address Line 1 *</label>
        <input {...register("addressLine1")} autoComplete="address-line1" aria-invalid={!!errors.addressLine1} placeholder="House / building, street" className={inputCls(!!errors.addressLine1)} />
        {errors.addressLine1 && <p className="text-[11px] text-red-500 mt-1">{errors.addressLine1.message}</p>}
      </div>
      <div>
        <label className={labelCls}>Address Line 2</label>
        <input {...register("addressLine2")} autoComplete="address-line2" placeholder="Apartment, floor, landmark (optional)" className={inputCls(false)} />
      </div>

      <label className="flex items-center gap-2 text-[13px] text-[#555] cursor-pointer select-none">
        <input type="checkbox" checked={!!isDefault} onChange={(e) => set("isDefault", e.target.checked)} className="accent-black w-4 h-4" />
        Set as default address
      </label>

      <div className="pt-1">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 bg-black text-white px-7 py-3 rounded-lg text-[11px] uppercase tracking-[0.16em] hover:bg-secondary transition-colors disabled:bg-gray-300"
        >
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? "Saving…" : initial ? "Save Changes" : "Add Address"}
        </button>
      </div>

      <AddressLabelDialog
        open={labelDialog}
        existingLabels={allLabels}
        onClose={() => setLabelDialog(false)}
        onCreate={(l) => {
          setCustomLabels((prev) => [...prev, l]);
          set("label", l);
          setLabelDialog(false);
        }}
      />
    </form>
  );
}
