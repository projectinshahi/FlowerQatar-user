import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api";
import { MAX_ADDRESSES, type AddressInput, type Address } from "@/lib/validations/address";

/**
 * Address business logic. Addresses are stored as a JSON array on `User.addresses`
 * (no separate table). All operations are scoped by userId, so a user can only ever
 * touch their own addresses. "Exactly one default" and unique labels are enforced here.
 */

function readAddresses(raw: unknown): Address[] {
  if (!Array.isArray(raw)) return [];
  return raw as Address[];
}

/** Default first, then most-recently-updated. */
function sortDefaultFirst(list: Address[]): Address[] {
  return [...list].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
}

async function loadAddresses(userId: string): Promise<Address[]> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { addresses: true } });
  if (!user) throw new ApiError("User not found", 404);
  return readAddresses(user.addresses);
}

async function saveAddresses(userId: string, list: Address[]): Promise<Address[]> {
  const sorted = sortDefaultFirst(list);
  await prisma.user.update({
    where: { id: userId },
    data: { addresses: sorted as unknown as Prisma.InputJsonValue },
  });
  return sorted;
}

function assertUniqueLabel(list: Address[], label: string, ignoreId?: string) {
  const norm = label.trim().toLowerCase();
  if (list.some((a) => a.id !== ignoreId && a.label.trim().toLowerCase() === norm)) {
    throw new ApiError(`You already have an address labelled "${label}".`, 409);
  }
}

function toRecord(id: string, data: AddressInput, isDefault: boolean, createdAt?: string): Address {
  const now = new Date().toISOString();
  return {
    id,
    label: data.label,
    countryCode: data.countryCode,
    countryName: data.countryName,
    stateCode: data.stateCode ?? null,
    stateName: data.stateName ?? null,
    city: data.city,
    postalCode: data.postalCode ?? "",
    addressLine1: data.addressLine1,
    addressLine2: data.addressLine2 ?? null,
    isDefault,
    createdAt: createdAt ?? now,
    updatedAt: now,
  };
}

export async function listAddresses(userId: string): Promise<Address[]> {
  return sortDefaultFirst(await loadAddresses(userId));
}

export async function getAddress(userId: string, id: string): Promise<Address> {
  const found = (await loadAddresses(userId)).find((a) => a.id === id);
  if (!found) throw new ApiError("Address not found", 404);
  return found;
}

export async function createAddress(userId: string, data: AddressInput): Promise<Address> {
  const list = await loadAddresses(userId);
  if (list.length >= MAX_ADDRESSES) throw new ApiError("Address limit reached.", 409);
  assertUniqueLabel(list, data.label);

  // The very first address is always default; otherwise honour the flag.
  const makeDefault = list.length === 0 || data.isDefault === true;
  const next = toRecord(randomUUID(), data, makeDefault);
  const updated = makeDefault ? list.map((a) => ({ ...a, isDefault: false })) : list;
  await saveAddresses(userId, [...updated, next]);
  return next;
}

export async function updateAddress(userId: string, id: string, data: AddressInput): Promise<Address> {
  const list = await loadAddresses(userId);
  const idx = list.findIndex((a) => a.id === id);
  if (idx === -1) throw new ApiError("Address not found", 404);
  assertUniqueLabel(list, data.label, id);

  const makeDefault = data.isDefault === true || list[idx].isDefault;
  const updatedItem = toRecord(id, data, makeDefault, list[idx].createdAt);
  const next = list.map((a, i) => (i === idx ? updatedItem : makeDefault ? { ...a, isDefault: false } : a));
  await saveAddresses(userId, next);
  return updatedItem;
}

export async function setDefaultAddress(userId: string, id: string): Promise<Address> {
  const list = await loadAddresses(userId);
  if (!list.some((a) => a.id === id)) throw new ApiError("Address not found", 404);
  const next = list.map((a) => ({ ...a, isDefault: a.id === id }));
  await saveAddresses(userId, next);
  return next.find((a) => a.id === id)!;
}

export async function deleteAddress(userId: string, id: string): Promise<{ id: string }> {
  const list = await loadAddresses(userId);
  const target = list.find((a) => a.id === id);
  if (!target) throw new ApiError("Address not found", 404);

  let remaining = list.filter((a) => a.id !== id);
  // If we removed the default, promote the first remaining address.
  if (target.isDefault && remaining.length > 0 && !remaining.some((a) => a.isDefault)) {
    remaining = remaining.map((a, i) => (i === 0 ? { ...a, isDefault: true } : a));
  }
  await saveAddresses(userId, remaining);
  return { id };
}
