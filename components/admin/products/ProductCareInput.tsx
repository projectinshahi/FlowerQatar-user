"use client";

import { useFormContext } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";

export default function ProductCareInput({ index }: { index: number }) {
  const { watch, setValue } = useFormContext();
  const fieldName = `variants.${index}.productCare`;
  const careValue = watch(fieldName);

  const [dos, setDos] = useState<string[]>([]);
  const [donts, setDonts] = useState<string[]>([]);
  const [doInput, setDoInput] = useState("");
  const [dontInput, setDontInput] = useState("");

  // Parse existing data on mount or value change
  useEffect(() => {
    try {
      if (careValue && careValue.startsWith('{')) {
        const parsed = JSON.parse(careValue);
        setDos(parsed.dos || []);
        setDonts(parsed.donts || []);
      }
    } catch (e) {
      console.error("Failed to parse product care JSON", e);
    }
  }, [careValue]);

  const updateForm = (newDos: string[], newDonts: string[]) => {
    setValue(fieldName, JSON.stringify({ dos: newDos, donts: newDonts }), { shouldValidate: true });
  };

  const addDo = () => {
    if (doInput.trim()) {
      const newDos = [...dos, doInput.trim()];
      setDos(newDos);
      setDoInput("");
      updateForm(newDos, donts);
    }
  };

  const addDont = () => {
    if (dontInput.trim()) {
      const newDonts = [...donts, dontInput.trim()];
      setDonts(newDonts);
      setDontInput("");
      updateForm(dos, newDonts);
    }
  };

  const removeDo = (idx: number) => {
    const newDos = dos.filter((_, i) => i !== idx);
    setDos(newDos);
    updateForm(newDos, donts);
  };

  const removeDont = (idx: number) => {
    const newDonts = donts.filter((_, i) => i !== idx);
    setDonts(newDonts);
    updateForm(dos, newDonts);
  };

  return (
    <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
      <label className="block text-sm font-medium text-gray-900">Product Care (Do's and Don'ts)</label>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* DOs Section */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-green-700 uppercase tracking-wider flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            DO
          </h4>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={doInput}
              onChange={e => setDoInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDo(); } }}
              placeholder="Keep in room temperature..."
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-green-500 outline-none text-sm bg-white"
            />
            <button type="button" onClick={addDo} className="p-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
              <Plus size={18} />
            </button>
          </div>
          <ul className="space-y-2">
            {dos.map((item, idx) => (
              <li key={idx} className="flex gap-2 items-start text-sm text-gray-700 bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                <span className="text-green-500 mt-0.5">•</span>
                <span className="flex-1">{item}</span>
                <button type="button" onClick={() => removeDo(idx)} className="text-gray-400 hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* DONTs Section */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            DON'T
          </h4>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={dontInput}
              onChange={e => setDontInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDont(); } }}
              placeholder="Do not water the florals..."
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-red-500 outline-none text-sm bg-white"
            />
            <button type="button" onClick={addDont} className="p-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors">
              <Plus size={18} />
            </button>
          </div>
          <ul className="space-y-2">
            {donts.map((item, idx) => (
              <li key={idx} className="flex gap-2 items-start text-sm text-gray-700 bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                <span className="text-red-500 mt-0.5">•</span>
                <span className="flex-1">{item}</span>
                <button type="button" onClick={() => removeDont(idx)} className="text-gray-400 hover:text-red-500">
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
