"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Info, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { DICTIONARY } from "@/constants/dictionary";
import { useCombinationAdminToast } from "@/features/combinations/components/admin/CombinationJobProvider";
import { resolveAdminActionError } from "@/features/auth/adminActionError";
import { saveGeneralSettings } from "@/features/settings/actions";
import { saveGeneralSettingsSchema } from "@/features/settings/schemas";
import { GOOGLE_PLACE_ID_MAX_LENGTH } from "@/features/settings/constants";
import type { GeneralSettingsFormValues } from "@/features/settings/types";
import { cn } from "@/utils/cn";
import {
  formatTurkishNationalPhoneInput,
  getTurkishNationalPhoneInputUpdate,
  parseTurkishPhone,
  TURKISH_PHONE_COUNTRY_PREFIX,
  TURKISH_PHONE_INPUT_MAX_LENGTH,
  TURKISH_PHONE_NATIONAL_DIGIT_LENGTH,
} from "@/utils/phone";

type GeneralSettingsField = keyof GeneralSettingsFormValues;
type FieldErrors = Partial<Record<GeneralSettingsField, string>>;

type FormFieldProps = {
  help: string;
  error?: string;
  children: ReactNode;
};

/**
 * Adds shared help and field-error text around existing form controls.
 *
 * @param props - Field control, help text, and optional validation error
 * @returns Accessible field supporting content
 */
const FormField = ({ help, error, children }: FormFieldProps) => (
  <div className="space-y-1.5">
    {children}
    <p className="text-xs leading-relaxed text-text-muted">{help}</p>
    {error && (
      <p className="text-sm text-error-text" role="alert">
        {error}
      </p>
    )}
  </div>
);

type GeneralSettingsFormProps = {
  initialValues: GeneralSettingsFormValues;
};

/**
 * Edits the isolated general-settings draft without mutating public data.
 *
 * @param props - Initial values resolved from a valid draft or published data
 * @returns General settings draft editor
 */
export const GeneralSettingsForm = ({
  initialValues,
}: GeneralSettingsFormProps) => {
  const router = useRouter();
  const { showToast } = useCombinationAdminToast();
  const d = DICTIONARY.admin.settings.general;
  const parsedInitialPhone = parseTurkishPhone(initialValues.phone);
  const initialFormValues = {
    ...initialValues,
    phone: parsedInitialPhone.success ? parsedInitialPhone.nationalNumber : "",
  };
  const [values, setValues] = useState(initialFormValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const isDirty = JSON.stringify(values) !== JSON.stringify(initialFormValues);
  const phoneDisplayValue = formatTurkishNationalPhoneInput(values.phone);

  const updateValue = (field: GeneralSettingsField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nativeEvent = event.nativeEvent as InputEvent;
    const update = getTurkishNationalPhoneInputUpdate(
      values.phone,
      event.target.value,
      nativeEvent.inputType,
      event.target.selectionStart,
    );

    if (!update.accepted) {
      setErrors((current) => ({
        ...current,
        phone:
          update.issue === "too_long"
            ? d.validation.phoneLength
            : d.validation.phone,
      }));
      return;
    }

    updateValue("phone", update.value);
  };

  const handlePhoneBlur = () => {
    if (
      values.phone.length > 0 &&
      values.phone.length < TURKISH_PHONE_NATIONAL_DIGIT_LENGTH
    ) {
      setErrors((current) => ({
        ...current,
        phone: d.validation.phone,
      }));
    }
  };

  const handlePhonePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const selectionStart = input.selectionStart ?? phoneDisplayValue.length;
    const selectionEnd = input.selectionEnd ?? selectionStart;
    const candidateValue =
      phoneDisplayValue.slice(0, selectionStart) +
      event.clipboardData.getData("text") +
      phoneDisplayValue.slice(selectionEnd);
    const update = getTurkishNationalPhoneInputUpdate(
      values.phone,
      candidateValue,
      "insertFromPaste",
      selectionStart,
    );

    event.preventDefault();
    if (!update.accepted) {
      setErrors((current) => ({
        ...current,
        phone:
          update.issue === "too_long"
            ? d.validation.phoneLength
            : d.validation.phone,
      }));
      return;
    }

    updateValue("phone", update.value);
  };

  const validate = (): boolean => {
    const result = saveGeneralSettingsSchema.safeParse(values);
    if (result.success) {
      setErrors({});
      return true;
    }

    const nextErrors: FieldErrors = {};
    result.error.issues.forEach((issue) => {
      const field = issue.path[0];
      if (
        typeof field === "string" &&
        field in values &&
        !nextErrors[field as GeneralSettingsField]
      ) {
        nextErrors[field as GeneralSettingsField] = issue.message;
      }
    });
    setErrors(nextErrors);
    return false;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving || !isDirty) return;

    if (!validate()) {
      showToast({ variant: "error", message: d.validationError });
      return;
    }

    setIsSaving(true);
    try {
      const result = await saveGeneralSettings(values);
      if (!result.success) {
        showToast({
          variant: "error",
          message: resolveAdminActionError(result, d.error),
        });
        return;
      }

      showToast({ variant: "success", message: d.success });
      router.refresh();
    } catch {
      showToast({ variant: "error", message: d.error });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex min-w-0 flex-col gap-8 rounded-brand-lg border border-brand-border bg-brand-surface p-4 sm:p-6"
      noValidate
    >
      <header className="space-y-2 border-b border-brand-border pb-4">
        <h2 className="font-heading text-xl font-bold text-text-primary">
          {d.title}
        </h2>
        <p className="text-sm text-text-secondary">{d.description}</p>
      </header>

      <div className="flex gap-3 rounded-brand-md border border-brand-primary/30 bg-brand-primary-light p-4 text-brand-primary">
        <Info className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <p className="text-sm leading-relaxed">{d.draftNotice}</p>
      </div>

      <fieldset className="space-y-5">
        <legend className="mb-4 font-heading text-lg font-bold text-text-primary">
          {d.contactSection}
        </legend>
        <div className="grid gap-5 md:grid-cols-2">
          <FormField help={d.fields.phone.help} error={errors.phone}>
            <div className="flex w-full flex-col space-y-1">
              <label
                htmlFor="phone"
                className="text-sm font-bold text-text-primary"
              >
                {d.fields.phone.label}
              </label>
              <div
                className={cn(
                  "relative w-full rounded-xl border bg-surface-neutral transition-all",
                  errors.phone
                    ? "border-error-border focus-within:border-error-border focus-within:ring-2 focus-within:ring-error-border/50"
                    : "border-brand-border focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/50",
                )}
              >
                <span
                  className="pointer-events-none absolute inset-y-0 left-4 flex select-none items-center text-text-primary"
                  aria-hidden="true"
                >
                  {TURKISH_PHONE_COUNTRY_PREFIX}
                </span>
                {values.phone.length === 0 && (
                  <span
                    className="pointer-events-none absolute inset-y-0 left-14 flex select-none items-center pl-1 text-text-muted"
                    aria-hidden="true"
                  >
                    {d.fields.phone.placeholder}
                  </span>
                )}
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  maxLength={TURKISH_PHONE_INPUT_MAX_LENGTH}
                  value={phoneDisplayValue}
                  aria-invalid={Boolean(errors.phone)}
                  className="w-full rounded-xl bg-transparent py-3 pr-4 pl-14 text-text-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                  onBlur={handlePhoneBlur}
                  onChange={handlePhoneChange}
                  onPaste={handlePhonePaste}
                />
              </div>
            </div>
          </FormField>
          <FormField help={d.fields.email.help} error={errors.email}>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              label={d.fields.email.label}
              placeholder={d.fields.email.placeholder}
              value={values.email}
              aria-invalid={Boolean(errors.email)}
              onChange={(event) => updateValue("email", event.target.value)}
            />
          </FormField>
          <FormField help={d.fields.address.help} error={errors.address}>
            <Textarea
              id="address"
              name="address"
              autoComplete="street-address"
              label={d.fields.address.label}
              placeholder={d.fields.address.placeholder}
              value={values.address}
              aria-invalid={Boolean(errors.address)}
              onChange={(event) => updateValue("address", event.target.value)}
            />
          </FormField>
          <FormField
            help={d.fields.workingHours.help}
            error={errors.workingHours}
          >
            <Input
              id="workingHours"
              name="workingHours"
              label={d.fields.workingHours.label}
              placeholder={d.fields.workingHours.placeholder}
              value={values.workingHours}
              aria-invalid={Boolean(errors.workingHours)}
              onChange={(event) =>
                updateValue("workingHours", event.target.value)
              }
            />
          </FormField>
        </div>
      </fieldset>

      <fieldset className="space-y-5 border-t border-brand-border pt-6">
        <legend className="mb-4 font-heading text-lg font-bold text-text-primary">
          {d.socialSection}
        </legend>
        <div className="grid gap-5 md:grid-cols-2">
          <FormField
            help={d.fields.instagramUrl.help}
            error={errors.instagramUrl}
          >
            <Input
              id="instagramUrl"
              name="instagramUrl"
              type="url"
              label={d.fields.instagramUrl.label}
              optionalText={d.optional}
              placeholder={d.fields.instagramUrl.placeholder}
              value={values.instagramUrl}
              aria-invalid={Boolean(errors.instagramUrl)}
              onChange={(event) =>
                updateValue("instagramUrl", event.target.value)
              }
            />
          </FormField>
          <FormField
            help={d.fields.facebookUrl.help}
            error={errors.facebookUrl}
          >
            <Input
              id="facebookUrl"
              name="facebookUrl"
              type="url"
              label={d.fields.facebookUrl.label}
              optionalText={d.optional}
              placeholder={d.fields.facebookUrl.placeholder}
              value={values.facebookUrl}
              aria-invalid={Boolean(errors.facebookUrl)}
              onChange={(event) =>
                updateValue("facebookUrl", event.target.value)
              }
            />
          </FormField>
          <FormField
            help={d.fields.googlePlaceId.help}
            error={errors.googlePlaceId}
          >
            <Input
              id="googlePlaceId"
              name="googlePlaceId"
              label={d.fields.googlePlaceId.label}
              optionalText={d.optional}
              placeholder={d.fields.googlePlaceId.placeholder}
              maxLength={GOOGLE_PLACE_ID_MAX_LENGTH}
              value={values.googlePlaceId}
              aria-invalid={Boolean(errors.googlePlaceId)}
              onChange={(event) =>
                updateValue("googlePlaceId", event.target.value)
              }
            />
          </FormField>
        </div>
      </fieldset>

      <fieldset className="space-y-5 border-t border-brand-border pt-6">
        <legend className="mb-4 font-heading text-lg font-bold text-text-primary">
          {d.sliderSection}
        </legend>
        <div className="grid gap-5 md:grid-cols-2">
          {(
            [
              "heroAutoplayDelay",
              "servicesAutoplayDelay",
              "whyUsAutoplayDelay",
              "reviewsAutoplayDelay",
            ] as const
          ).map((field) => (
            <FormField
              key={field}
              help={d.fields[field].help}
              error={errors[field]}
            >
              <Input
                id={field}
                name={field}
                type="number"
                min="2"
                max="120"
                step="1"
                label={d.fields[field].label}
                value={values[field]}
                aria-invalid={Boolean(errors[field])}
                onChange={(event) => updateValue(field, event.target.value)}
              />
            </FormField>
          ))}
        </div>
      </fieldset>

      <div className="flex justify-end border-t border-brand-border pt-4">
        <Button
          type="submit"
          variant="primary"
          disabled={isSaving || !isDirty}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {d.saving}
            </>
          ) : (
            <>
              <Save className="h-4 w-4" aria-hidden="true" />
              {d.save}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
