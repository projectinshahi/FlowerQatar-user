"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";
import { Loader2, AlertCircle } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { errMsg } from "../../lib/error";
import ProfileImageUploader from "./ProfileImageUploader";
import PhoneField from "./PhoneField";

interface Profile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  profileImage: string | null;
  dateOfBirth: string | null;
  role: string;
  isEmailVerified: boolean;
}

const profileFormSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(50, "First name is too long"),
  lastName: z.string().trim().min(1, "Last name is required").max(50, "Last name is too long"),
  phone: z.string().refine((v) => !v || isValidPhoneNumber(v), "Enter a valid phone number"),
  dateOfBirth: z.string().refine((v) => {
    if (!v) return true;
    const d = new Date(v);
    return !isNaN(d.getTime()) && d < new Date() && d > new Date("1900-01-01");
  }, "Enter a valid date of birth"),
  profileImage: z.string().nullable(),
});

type FormValues = z.infer<typeof profileFormSchema>;

const labelCls = "block text-[10px] uppercase tracking-[0.15em] text-[#8A8A8A] mb-1.5";
const inputCls =
  "w-full rounded-lg border border-[#E2E2E2] text-sm py-2.5 px-3 focus:border-primary outline-none bg-white transition-colors disabled:bg-[#F7F7F7]";

function toValues(p: Profile): FormValues {
  return {
    firstName: p.firstName ?? "",
    lastName: p.lastName ?? "",
    phone: p.phone ?? "",
    dateOfBirth: p.dateOfBirth ? p.dateOfBirth.slice(0, 10) : "",
    profileImage: p.profileImage ?? null,
  };
}

export default function ProfileForm() {
  const { addToast, setUser, user } = useApp();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { firstName: "", lastName: "", phone: "", dateOfBirth: "", profileImage: null },
  });

  const load = async () => {
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.error || "Could not load your profile");
      setProfile(data.data);
      reset(toValues(data.data));
      setLoadError(null);
    } catch (e) {
      setLoadError(errMsg(e, "Could not load your profile"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retry = () => {
    setLoading(true);
    load();
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: values.firstName,
          lastName: values.lastName,
          phone: values.phone || null,
          profileImage: values.profileImage,
          dateOfBirth: values.dateOfBirth || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.error || "Unable to update profile");
      setProfile(data.data);
      reset(toValues(data.data));
      setUser(
        user
          ? { ...user, firstName: data.data.firstName, lastName: data.data.lastName, phone: data.data.phone, profileImage: data.data.profileImage }
          : user
      );
      addToast("Profile updated successfully.", "success");
    } catch {
      addToast("Unable to update profile. Please try again.", "error");
    }
  };

  const fn = watch("firstName");
  const ln = watch("lastName");
  const initials = `${fn?.[0] ?? ""}${ln?.[0] ?? ""}`.toUpperCase() || "U";

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#EEE] bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-5 mb-8">
          <div className="w-24 h-24 rounded-full skeleton" />
          <div className="h-9 w-28 skeleton rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i}>
              <div className="h-3 w-24 skeleton mb-2" />
              <div className="h-10 skeleton rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div className="max-w-md border border-red-100 bg-red-50 p-6 rounded-2xl text-center">
        <AlertCircle className="mx-auto mb-3 text-red-400" />
        <p className="text-sm text-red-600 mb-4">{loadError || "Something went wrong."}</p>
        <button type="button" onClick={retry} className="border border-black px-5 py-2 rounded-lg text-[11px] uppercase tracking-[0.12em] hover:bg-black hover:text-white transition-colors">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-2xl border border-[#ECECEC] bg-white p-6 sm:p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
      <div className="mb-1">
        <h2 className="font-serif text-[22px] text-primary">Personal Information</h2>
        <p className="text-[13px] text-[#8A8A8A] mt-0.5">Update your personal details and profile photo.</p>
      </div>

      <fieldset disabled={isSubmitting} className="disabled:opacity-70 transition-opacity">
        <div className="my-7">
          <Controller
            name="profileImage"
            control={control}
            render={({ field }) => (
              <ProfileImageUploader value={field.value} onChange={field.onChange} initials={initials} disabled={isSubmitting} />
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelCls} htmlFor="firstName">First Name *</label>
            <input id="firstName" className={inputCls} {...register("firstName")} />
            {errors.firstName && <p className="text-[11px] text-red-500 mt-1">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className={labelCls} htmlFor="lastName">Last Name *</label>
            <input id="lastName" className={inputCls} {...register("lastName")} />
            {errors.lastName && <p className="text-[11px] text-red-500 mt-1">{errors.lastName.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input className={inputCls} value={profile.email} disabled readOnly />
            <p className="text-[10px] text-[#B0B0B0] mt-1">Email cannot be changed here.</p>
          </div>
          <div>
            <label className={labelCls} htmlFor="phone">Phone</label>
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <PhoneField id="phone" value={field.value} onChange={field.onChange} invalid={!!errors.phone} disabled={isSubmitting} />
              )}
            />
            {errors.phone && <p className="text-[11px] text-red-500 mt-1">{errors.phone.message}</p>}
          </div>
          <div>
            <label className={labelCls} htmlFor="dob">Date of Birth</label>
            <input id="dob" type="date" max={new Date().toISOString().slice(0, 10)} className={inputCls} {...register("dateOfBirth")} />
            {errors.dateOfBirth && <p className="text-[11px] text-red-500 mt-1">{errors.dateOfBirth.message}</p>}
          </div>
        </div>
      </fieldset>

      <div className="flex items-center gap-3 mt-9">
        <button
          type="submit"
          disabled={!isDirty || isSubmitting}
          className="inline-flex items-center gap-2 bg-black text-white px-7 py-3 rounded-lg text-[11px] uppercase tracking-[0.18em] hover:bg-secondary transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isSubmitting && <Loader2 size={14} className="animate-spin" />}
          {isSubmitting ? "Saving…" : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={() => reset(toValues(profile))}
          disabled={!isDirty || isSubmitting}
          className="px-7 py-3 text-[11px] uppercase tracking-[0.18em] text-[#666] hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
