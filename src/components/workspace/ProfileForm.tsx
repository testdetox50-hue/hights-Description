"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";

import PasswordStrengthMeter, { evaluatePassword } from "./PasswordStrengthMeter";

export type ProfileFormValues = {
  fullName: string;
  email: string;
  phone: string;
  newPassword: string;
  confirmPassword: string;
};

type Errors = Partial<Record<keyof ProfileFormValues, string>>;

export function validateProfile(values: ProfileFormValues): Errors {
  const errors: Errors = {};

  if (values.fullName.trim().length < 2) {
    errors.fullName = "Enter your full name.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  if (values.phone.trim() && !/^\+?[\d\s-]{7,15}$/.test(values.phone.trim())) {
    errors.phone = "Enter a valid phone number.";
  }
  if (values.newPassword) {
    if (evaluatePassword(values.newPassword).score < 2) {
      errors.newPassword = "Choose a stronger password.";
    }
    if (values.newPassword !== values.confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }
  }
  return errors;
}

type ProfileFormProps = {
  initialValues: Pick<ProfileFormValues, "fullName" | "email" | "phone">;
  onSubmit: (values: ProfileFormValues) => void | Promise<void>;
  submitLabel?: string;
};

export default function ProfileForm({ initialValues, onSubmit, submitLabel = "Save changes" }: ProfileFormProps) {
  const [values, setValues] = useState<ProfileFormValues>({
    ...initialValues,
    newPassword: "",
    confirmPassword: ""
  });
  const [touched, setTouched] = useState<Partial<Record<keyof ProfileFormValues, boolean>>>({});
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const errors = validateProfile(values);
  const dirty = (Object.keys(initialValues) as (keyof typeof initialValues)[]).some(
    (key) => values[key] !== initialValues[key]
  ) || Boolean(values.newPassword);

  const handleChange = (field: keyof ProfileFormValues) => (event: ChangeEvent<HTMLInputElement>) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setStatus(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setTouched({ fullName: true, email: true, phone: true, newPassword: true, confirmPassword: true });
    if (Object.keys(errors).length > 0) {
      return;
    }
    setSaving(true);
    try {
      await onSubmit({ ...values, fullName: values.fullName.trim(), email: values.email.trim(), phone: values.phone.trim() });
      setValues((current) => ({ ...current, newPassword: "", confirmPassword: "" }));
      setTouched({});
      setStatus("Profile saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  const field = (name: keyof ProfileFormValues, label: string, type = "text", autoComplete?: string) => {
    const message = touched[name] ? errors[name] : undefined;
    return (
      <label className="block space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</span>
        <input
          type={type}
          value={values[name]}
          autoComplete={autoComplete}
          onChange={handleChange(name)}
          onBlur={() => setTouched((current) => ({ ...current, [name]: true }))}
          aria-invalid={Boolean(message)}
          className={`w-full rounded-2xl border bg-white/5 px-4 py-3 text-sm text-white focus:outline-none ${message ? "border-rose-400/50" : "border-white/10 focus:border-violet-400/50"}`}
        />
        {message ? <span role="alert" className="block text-xs text-rose-300">{message}</span> : null}
      </label>
    );
  };

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        {field("fullName", "Full name", "text", "name")}
        {field("email", "Email", "email", "email")}
        {field("phone", "Phone", "tel", "tel")}
      </div>
      <fieldset className="space-y-4 rounded-2xl border border-white/10 p-4">
        <legend className="px-2 text-xs uppercase tracking-[0.2em] text-slate-400">Change password (optional)</legend>
        {field("newPassword", "New password", "password", "new-password")}
        <PasswordStrengthMeter password={values.newPassword} />
        {field("confirmPassword", "Confirm password", "password", "new-password")}
      </fieldset>
      <div className="flex items-center gap-4">
        <button type="submit" disabled={saving || !dirty} className="rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
          {saving ? "Saving..." : submitLabel}
        </button>
        {status ? <p role="status" className="text-sm text-slate-300">{status}</p> : null}
      </div>
    </form>
  );
}
