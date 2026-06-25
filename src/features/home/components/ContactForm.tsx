"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { DICTIONARY } from "@/constants/dictionary";
import { sendContactForm } from "../actions/sendContact";
import { Button } from "@/components/ui/Button";
import { Send, Loader2 } from "lucide-react";
import { formatTurkishPhoneInput } from "@/utils/phone";
import { Alert } from "@/components/ui/Alert";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import type { PestDoc, RegionDoc } from "@/types";

type ContactFormProps = {
  pests: PestDoc[];
  regions: RegionDoc[];
};

export const ContactForm = ({ pests, regions }: ContactFormProps) => {
  const dict = DICTIONARY.home.contact.form;
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [phone, setPhone] = useState("");
  const [formKey, setFormKey] = useState(0);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatTurkishPhoneInput(e.target.value));
  };

  const handleFormChange = () => {
    if (status === "success" || status === "error") {
      setStatus("idle");
    }
  };

  const formAction = async (formData: FormData) => {
    setStatus("idle");
    setErrorMsg("");

    const result = await sendContactForm(formData);

    if (result.success) {
      setStatus("success");
      setPhone(""); // Reset phone
      setFormKey((prev) => prev + 1); // Reset entire form (including Select states)
    } else {
      setStatus("error");
      setErrorMsg(result.error || dict.error);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-brand-surface rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl border border-brand-border relative">
      {/* Decorative Blob Wrapper (contains blob without clipping dropdowns) */}
      <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
        <div
          className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"
          aria-hidden="true"
        />
      </div>

      <form
        key={formKey}
        onChange={handleFormChange}
        action={formAction}
        className="relative z-10 flex flex-col space-y-6"
      >
        {/* Name & Phone Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Input
            id="name"
            name="name"
            label={dict.name}
            placeholder={dict.namePlaceholder}
            required
          />

          <Input
            id="phone"
            name="phone"
            type="tel"
            label={dict.phone}
            placeholder={dict.phonePlaceholder}
            value={phone}
            onChange={handlePhoneChange}
            required
          />
        </div>

        {/* Service Select */}
        <Select
          id="service"
          name="service"
          label={dict.service}
          optionalText={dict.optionalText}
          placeholder={dict.servicePlaceholder}
          options={[
            ...pests.map((pest) => ({ value: pest.name, label: pest.name })),
            { value: dict.otherValue, label: dict.other },
          ]}
        />

        {/* Region Select */}
        <Select
          id="region"
          name="region"
          label={dict.region}
          optionalText={dict.optionalText}
          placeholder={dict.regionPlaceholder}
          options={[
            ...regions.map((region) => ({
              value: region.name,
              label: region.name,
            })),
            { value: dict.otherValue, label: dict.other },
          ]}
        />

        {/* Status Messages */}
        {status === "success" && (
          <Alert variant="success" message={dict.success} />
        )}

        {status === "error" && <Alert variant="error" message={errorMsg} />}

        {/* Submit Button */}
        <SubmitButton dict={dict} />
      </form>
    </div>
  );
};

type ContactFormDict = typeof DICTIONARY.home.contact.form;

const SubmitButton = ({ dict }: { dict: ContactFormDict }) => {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="primary"
      disabled={pending}
      className="w-full py-4 rounded-xl text-base font-bold shadow-lg shadow-brand-primary/20"
    >
      {pending ? (
        <span className="flex items-center">
          <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
          {dict.submitting}
        </span>
      ) : (
        <span className="flex items-center">
          <Send className="w-5 h-5 mr-2" />
          {dict.submit}
        </span>
      )}
    </Button>
  );
};
