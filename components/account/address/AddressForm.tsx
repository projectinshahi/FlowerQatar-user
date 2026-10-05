"use client";

import { useMemo, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { ADDRESS_COUNTRY, addressSchema, type Address, type AddressInput } from "@/lib/validations/address";
import AddressLabelDialog from "./AddressLabelDialog";
import LabelGlyph from "./LabelGlyph";
import Flag from "./Flag";

type FormValues = {
  label: string;
  zone: string;
  street: string;
  building: string;
  unit: string;
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
    // An address saved before the Qatar format has no zone/street/building, so editing it
    // starts those fields empty and the customer fills them in once.
    defaultValues: {
      label: initial?.label ?? "Home",
      zone: initial?.zone ?? "",
      street: initial?.street ?? "",
      building: initial?.building ?? "",
      unit: initial?.unit ?? "",
      isDefault: initial?.isDefault ?? false,
    },
  });

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

      {/* Country — fixed: we deliver within Qatar only */}
      <div>
        <span className={labelCls}>Country</span>
        <div aria-readonly="true" className={`${inputCls(false)} flex items-center gap-2 bg-[#F7F5F1] text-[#555] cursor-not-allowed`}>
          <Flag code={ADDRESS_COUNTRY.code} /> {ADDRESS_COUNTRY.name}
        </div>
      </div>

      {/* Qatar national address — the numbers on the building's blue plate */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="addr-zone" className={labelCls}>Zone *</label>
          <input id="addr-zone" {...register("zone")} inputMode="numeric" maxLength={3} aria-invalid={!!errors.zone} placeholder="e.g. 66" className={inputCls(!!errors.zone)} />
          {errors.zone && <p className="text-[11px] text-red-500 mt-1">{errors.zone.message}</p>}
        </div>
        <div>
          <label htmlFor="addr-street" className={labelCls}>Street *</label>
          <input id="addr-street" {...register("street")} autoComplete="address-line1" aria-invalid={!!errors.street} placeholder="e.g. 920" className={inputCls(!!errors.street)} />
          {errors.street && <p className="text-[11px] text-red-500 mt-1">{errors.street.message}</p>}
        </div>
        <div>
          <label htmlFor="addr-building" className={labelCls}>Building *</label>
          <input id="addr-building" {...register("building")} aria-invalid={!!errors.building} placeholder="e.g. 12" className={inputCls(!!errors.building)} />
          {errors.building && <p className="text-[11px] text-red-500 mt-1">{errors.building.message}</p>}
        </div>
        <div>
          <label htmlFor="addr-unit" className={labelCls}>Unit</label>
          <input id="addr-unit" {...register("unit")} autoComplete="address-line2" aria-invalid={!!errors.unit} placeholder="Apartment / villa no. (optional)" className={inputCls(!!errors.unit)} />
          {errors.unit && <p className="text-[11px] text-red-500 mt-1">{errors.unit.message}</p>}
        </div>
      </div>
      <p className="-mt-2 text-[11px] text-[#8A8A8A]">You&apos;ll find these numbers on the blue plate outside your building.</p>

      <label className="flex items-center gap-2 text-[13px] text-[#555] cursor-pointer select-none">
        <input type="checkbox" checked={!!isDefault} onChange={(e) => set("isDefault", e.target.checked)} className="accent-black w-4 h-4" />
        Set as default address
      </label>

      {/*
        Pinned to the foot of the sheet instead of sitting at the end of a long scroll, so
        the action is reachable the moment the dialog opens. It bleeds to the sheet edges
        (-mx-6, matching the modal body's px-6) and carries the iOS home-indicator inset so
        the button is never under it. On a phone it spans the width, the usual sheet shape.
      */}
      <div className="sticky bottom-0 -mx-6 -mb-5 mt-2 border-t border-[#EFEFEF] bg-white/95 px-6 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] backdrop-blur-sm">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex w-full items-center justify-center gap-2 bg-black text-white px-7 py-3 rounded-lg text-[11px] uppercase tracking-[0.16em] hover:bg-secondary transition-colors disabled:bg-gray-300 sm:w-auto"
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
