"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

/**
 * Manages the `variants.${index}.productCare` object ({ dos: string[], donts: string[] })
 * stored inside the Product.variants JSON. Rendered on the storefront as the
 * "Product Care" section (Do's & Don'ts).
 */
export default function ProductCareInput({ variantIndex }: { variantIndex: number }) {
  const { control, setValue } = useFormContext();

  const dosName = `variants.${variantIndex}.productCare.dos`;
  const dontsName = `variants.${variantIndex}.productCare.donts`;

  const dos: string[] = useWatch({ control, name: dosName }) || [];
  const donts: string[] = useWatch({ control, name: dontsName }) || [];

  const [doInput, setDoInput] = useState("");
  const [dontInput, setDontInput] = useState("");

  const addItem = (name: string, list: string[], value: string, reset: () => void) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setValue(name, [...list, trimmed], { shouldValidate: true, shouldDirty: true });
    reset();
  };

  const removeItem = (name: string, list: string[], idx: number) => {
    setValue(
      name,
      list.filter((_, i) => i !== idx),
      { shouldValidate: true, shouldDirty: true }
    );
  };

  return (
    <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
      <div>
        <label className="block text-sm font-medium text-gray-900">Product Care</label>
        <p className="text-xs text-gray-500">Do&apos;s &amp; Don&apos;ts shown on the product page.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* DO */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-green-700 uppercase tracking-wider flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            Do
          </h4>
          <div className="flex gap-2">
            <input
              type="text"
              value={doInput}
              onChange={(e) => setDoInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addItem(dosName, dos, doInput, () => setDoInput(""));
                }
              }}
              placeholder="Keep at room temperature..."
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-green-500 outline-none text-sm bg-white"
            />
            <button
              type="button"
              onClick={() => addItem(dosName, dos, doInput, () => setDoInput(""))}
              className="p-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>
          <ul className="space-y-2">
            {dos.map((item, idx) => (
              <li key={idx} className="flex gap-2 items-start text-sm text-gray-700 bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                <span className="text-green-500 mt-0.5">•</span>
                <span className="flex-1">{item}</span>
                <button type="button" onClick={() => removeItem(dosName, dos, idx)} className="text-gray-400 hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* DON'T */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            Don&apos;t
          </h4>
          <div className="flex gap-2">
            <input
              type="text"
              value={dontInput}
              onChange={(e) => setDontInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addItem(dontsName, donts, dontInput, () => setDontInput(""));
                }
              }}
              placeholder="Do not water the florals..."
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-red-500 outline-none text-sm bg-white"
            />
            <button
              type="button"
              onClick={() => addItem(dontsName, donts, dontInput, () => setDontInput(""))}
              className="p-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>
          <ul className="space-y-2">
            {donts.map((item, idx) => (
              <li key={idx} className="flex gap-2 items-start text-sm text-gray-700 bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                <span className="text-red-500 mt-0.5">•</span>
                <span className="flex-1">{item}</span>
                <button type="button" onClick={() => removeItem(dontsName, donts, idx)} className="text-gray-400 hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
