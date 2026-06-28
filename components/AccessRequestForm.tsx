"use client";

import Link from "next/link";
import { useState } from "react";
import { submitAccessRequest } from "@/lib/auth/accessActions";

const inputClassName =
  "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-700";

const primaryButtonClassName =
  "w-full rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60";

const secondaryLinkClassName = "font-semibold text-blue-700 hover:text-blue-800";

export function AccessRequestForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [facility, setFacility] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    const result = await submitAccessRequest({
      firstName,
      lastName,
      email,
      facility,
      jobTitle,
    });

    if (!result.success) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    setMessage(
      "Access request submitted with Pending status. An executive must approve it before you can sign in.",
    );
    setFirstName("");
    setLastName("");
    setEmail("");
    setFacility("");
    setJobTitle("");
    setIsSubmitting(false);
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="mb-1 block text-sm text-slate-600">
            First name
          </label>
          <input
            id="firstName"
            required
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            className={inputClassName}
          />
        </div>
        <div>
          <label htmlFor="lastName" className="mb-1 block text-sm text-slate-600">
            Last name
          </label>
          <input
            id="lastName"
            required
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            className={inputClassName}
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="mb-1 block text-sm text-slate-600">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={inputClassName}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="facility" className="mb-1 block text-sm text-slate-600">
            Facility
          </label>
          <input
            id="facility"
            required
            value={facility}
            onChange={(event) => setFacility(event.target.value)}
            className={inputClassName}
          />
        </div>
        <div>
          <label htmlFor="jobTitle" className="mb-1 block text-sm text-slate-600">
            Job title
          </label>
          <input
            id="jobTitle"
            required
            value={jobTitle}
            onChange={(event) => setJobTitle(event.target.value)}
            className={inputClassName}
          />
        </div>
      </div>

      <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        This creates a Pending access request only. An executive will create your sign-in credentials
        when your request is approved.
      </p>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {message ? <p className="text-sm text-green-700">{message}</p> : null}

      <button type="submit" disabled={isSubmitting} className={primaryButtonClassName}>
        {isSubmitting ? "Submitting request..." : "Submit access request"}
      </button>

      <p className="text-center text-sm text-slate-600">
        Already approved?{" "}
        <Link href="/login" className={secondaryLinkClassName}>
          Sign in
        </Link>
      </p>
    </form>
  );
}
