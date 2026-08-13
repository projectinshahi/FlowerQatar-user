"use client";

import { useState } from "react";
import { MapPin, Plus, AlertCircle } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAddresses } from "../../hooks/useAddresses";
import type { Address, AddressInput } from "@/lib/validations/address";
import AddressList from "./address/AddressList";
import AddressModal from "./address/AddressModal";
import AddressForm from "./address/AddressForm";
import DeleteConfirmationDialog from "./address/DeleteConfirmationDialog";
import { Skeleton } from '@/components/ui/Skeleton';

export default function AddressesManager() {
  const { addToast } = useApp();
  const { addresses, loading, error, reload, save, remove, setDefault } = useAddresses();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Address | null>(null);

  const openAdd = () => {
    setEditing(null);
    setServerError(null);
    setModalOpen(true);
  };
  const openEdit = (a: Address) => {
    setEditing(a);
    setServerError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (data: AddressInput) => {
    setSaving(true);
    setServerError(null);
    const res = await save(data, editing?.id);
    setSaving(false);
    if (!res.ok) {
      setServerError(res.error);
      return;
    }
    setModalOpen(false);
    addToast(editing ? "Address updated." : "Address added.", "success");
  };

  const handleSetDefault = async (a: Address) => {
    if (a.isDefault) return;
    setBusyId(a.id);
    const res = await setDefault(a);
    setBusyId(null);
    addToast(res.ok ? "Default address updated." : res.error || "Could not set default", res.ok ? "success" : "error");
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setBusyId(confirmDelete.id);
    const res = await remove(confirmDelete);
    setBusyId(null);
    if (res.ok) {
      addToast("Address deleted.", "info");
      setConfirmDelete(null);
    } else {
      addToast(res.error || "Could not delete the address", "error");
    }
  };

  const hasAddresses = addresses.length > 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-serif text-[22px] text-primary">Saved Addresses</h2>
          <p className="text-[13px] text-[#8A8A8A] mt-0.5">Manage your delivery addresses.</p>
        </div>
        {hasAddresses && (
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 border border-black px-4 py-2.5 rounded-lg text-[11px] uppercase tracking-[0.14em] hover:bg-black hover:text-white transition-colors"
          >
            <Plus size={15} /> Add Address
          </button>
        )}
      </div>

      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5" aria-hidden="true">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="max-w-md border border-red-100 bg-red-50 p-6 rounded-2xl text-center">
          <AlertCircle className="mx-auto mb-3 text-red-400" />
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button onClick={reload} className="border border-black px-5 py-2 rounded-lg text-[11px] uppercase tracking-[0.12em] hover:bg-black hover:text-white transition-colors">
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && !hasAddresses && (
        <div className="rounded-2xl border border-dashed border-[#DDD] py-16 text-center">
          <MapPin className="mx-auto mb-4 text-[#C9C2B5]" size={34} />
          <p className="text-[15px] text-primary font-serif mb-1">No addresses yet</p>
          <p className="text-[13px] text-[#999] mb-6">Add your first delivery address to speed up checkout.</p>
          <button onClick={openAdd} className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-lg text-[11px] uppercase tracking-[0.16em] hover:bg-secondary transition-colors">
            <Plus size={15} /> Add Address
          </button>
        </div>
      )}

      {!loading && !error && hasAddresses && (
        <AddressList
          addresses={addresses}
          busyId={busyId}
          onAdd={openAdd}
          onEdit={openEdit}
          onDelete={setConfirmDelete}
          onSetDefault={handleSetDefault}
        />
      )}

      <AddressModal open={modalOpen} title={editing ? "Edit Address" : "Add New Address"} onClose={() => (saving ? undefined : setModalOpen(false))}>
        <AddressForm key={editing?.id ?? "new"} initial={editing} saving={saving} serverError={serverError} onSubmit={handleSubmit} />
      </AddressModal>

      <DeleteConfirmationDialog
        open={!!confirmDelete}
        busy={!!confirmDelete && busyId === confirmDelete.id}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
