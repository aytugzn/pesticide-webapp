"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { DICTIONARY } from "@/constants/dictionary";
import { MUTATION_POLICY_ERROR } from "@/constants/mutationPolicy";
import { sendContactForm } from "../actions/sendContact";
import { CONTACT_ERRORS } from "../types";
import { Button } from "@/components/ui/Button";
import { Send, Loader2 } from "lucide-react";
import {
  getTurkishPhoneInputUpdate,
  TURKISH_PHONE_INPUT_MAX_LENGTH,
} from "@/utils/phone";
import { Alert } from "@/components/ui/Alert";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { cn } from "@/utils/cn";
import type { PestDoc, RegionDoc } from "@/types";

type ContactFormProps = {
  pests: PestDoc[];
  regions: RegionDoc[];
  className?: string;
};

export const ContactForm = ({ pests, regions, className }: ContactFormProps) => {
  const dict = DICTIONARY.home.contact.form;
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [formKey, setFormKey] = useState(0);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nativeEvent = e.nativeEvent as InputEvent;
    const update = getTurkishPhoneInputUpdate(
      phone,
      e.target.value,
      nativeEvent.inputType,
      false,
      e.target.selectionStart,
    );

    if (!update.accepted) {
      setPhoneError(
        update.issue === "too_long"
          ? DICTIONARY.home.contact.validation.phoneLength
          : DICTIONARY.home.contact.validation.phoneInvalid,
      );
      return;
    }

    setPhoneError("");
    setPhone(update.value);
  };

  const handlePhonePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const selectionStart = input.selectionStart ?? phone.length;
    const selectionEnd = input.selectionEnd ?? selectionStart;
    const candidateValue =
      phone.slice(0, selectionStart) +
      event.clipboardData.getData("text") +
      phone.slice(selectionEnd);

    const update = getTurkishPhoneInputUpdate(
      phone,
      candidateValue,
      "insertFromPaste",
      false,
      selectionStart,
    );
    if (!update.accepted) {
      event.preventDefault();
      setPhoneError(
        update.issue === "too_long"
          ? DICTIONARY.home.contact.validation.phoneLength
          : DICTIONARY.home.contact.validation.phoneInvalid,
      );
    }
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
      setPhoneError("");
      setFormKey((prev) => prev + 1); // Reset entire form (including Select states)
    } else {
      setStatus("error");

      let message = dict.error;
      switch (result.error) {
        case MUTATION_POLICY_ERROR:
          message = dict.temporarilyUnavailable;
          break;
        case CONTACT_ERRORS.VALIDATION_FAILED:
          message = DICTIONARY.home.contact.validation.invalidFormat;
          break;
        case CONTACT_ERRORS.RATE_LIMITED:
          message = DICTIONARY.home.contact.validation.rateLimit;
          break;
        case CONTACT_ERRORS.PENDING_LIMIT_REACHED:
          message = DICTIONARY.home.contact.contactRequest.pendingLimitReached;
          break;
        case CONTACT_ERRORS.SAVE_FAILED:
        default:
          message = dict.error;
      }

      setErrorMsg(message);
    }
  };

  return (
    <div
      className={cn(
        "w-full max-w-2xl mx-auto bg-brand-surface rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl border border-brand-border relative overflow-visible",
        className,
      )}
    >
      <div className="absolute inset-0 pointer-events-none">
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
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-96 top-0 h-px w-px overflow-hidden opacity-0"
          >
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />
          </div>

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
            autoComplete="tel"
            inputMode="tel"
            label={dict.phone}
            optionalText={dict.phoneHint}
            placeholder={dict.phonePlaceholder}
            maxLength={TURKISH_PHONE_INPUT_MAX_LENGTH}
            value={phone}
            error={phoneError}
            onChange={handlePhoneChange}
            onPaste={handlePhonePaste}
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
