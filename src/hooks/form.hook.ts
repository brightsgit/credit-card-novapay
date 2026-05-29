import { useCallback, useMemo, useState } from "react";

export type FormValues<T> = {
  [key in keyof T]: T[key];
};
export type FormPartialValues<T, R> = Partial<Record<keyof T, R>>;

export default function useForm<T>({
  initialValues,
  validator,
}: {
  initialValues: FormValues<T>;
  validator?: (values: FormValues<T>) => FormPartialValues<T, string>;
}) {
  const [values, setValues] = useState<FormValues<T>>(initialValues);
  const [errors, setErrors] = useState<FormPartialValues<T, string>>({});
  const [touched, setTouched] = useState<FormPartialValues<T, boolean>>({});

  const dirtyFields = useMemo(
    () =>
      Object.keys(initialValues).reduce(
        (acc, key) => {
          if (values[key as keyof T] !== initialValues[key as keyof T]) {
            acc[key as keyof T] = true;
          }
          if (
            Array.isArray(values[key as keyof T]) &&
            Array.isArray(initialValues[key as keyof T])
          ) {
            acc[key as keyof T] =
              JSON.stringify(values[key as keyof T]) !==
              JSON.stringify(initialValues[key as keyof T]);
          }
          if (
            values[key as keyof T] instanceof Date &&
            initialValues[key as keyof T] instanceof Date
          ) {
            acc[key as keyof T] =
              (values[key as keyof T] as unknown as Date).getTime() !==
              (initialValues[key as keyof T] as unknown as Date).getTime();
          }
          return acc;
        },
        {} as FormPartialValues<T, boolean>,
      ),
    [values, initialValues],
  );

  const getErrorMessages = useCallback(
    (val: FormValues<T>, touchedFields: FormPartialValues<T, boolean>) => {
      if (!validator) {
        return {};
      }
      const validationErrors = validator(val);
      const errorMessages: FormPartialValues<T, string> = {};
      Object.keys(validationErrors).forEach((key) => {
        if (touchedFields[key as keyof T]) {
          errorMessages[key as keyof T] = validationErrors[key as keyof T];
        }
      });
      return errorMessages;
    },
    [validator],
  );

  const handleChange = (name: keyof T, value: T[keyof T]) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    const validationErrors = getErrorMessages(
      { ...values, [name]: value },
      { ...touched, [name]: true },
    );
    setErrors((prev) => ({ ...prev, ...validationErrors }));
  };

  const handleBlur = (name: keyof T) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const validationErrors = getErrorMessages(values, {
      ...touched,
      [name]: true,
    });
    setErrors((prev) => ({ ...prev, ...validationErrors }));
  };

  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  const resetField = (name: keyof T) => {
    setValues((prev) => ({ ...prev, [name]: initialValues[name] }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setTouched((prev) => ({ ...prev, [name]: false }));
  };

  const isFormTouched = useMemo(
    () => Object.values(touched).some((isTouched) => isTouched),
    [touched],
  );

  const isFormDirty = useMemo(
    () => Object.values(dirtyFields).some((isDirty) => isDirty),
    [dirtyFields],
  );

  const checkFormValidity = useCallback(() => {
    const touchedFields = Object.keys(values).reduce(
      (acc, key) => {
        acc[key as keyof T] = true;
        return acc;
      },
      {} as FormPartialValues<T, boolean>,
    );
    setTouched(touchedFields);
    const validationErrors = getErrorMessages(values, touchedFields);
    setErrors(validationErrors);

    return Object.values(validationErrors).every((val) => val === "");
  }, [values, getErrorMessages]);

  return {
    values,
    errors,
    touched,
    isFormTouched,
    dirtyFields,
    isFormDirty,
    handleChange,
    handleBlur,
    resetForm,
    resetField,
    checkFormValidity,
  };
}
