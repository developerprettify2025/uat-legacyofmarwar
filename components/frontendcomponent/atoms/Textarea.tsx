"use client";

import { useCallback, useState } from "react";
import type { SyntheticEvent } from "react";

interface TextareaProps {
  classname?: string;
  label?: string;
  name: string;
  id: string;
  onChange?: (e: SyntheticEvent<HTMLTextAreaElement>) => void;
  value?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export default function Textarea({
  classname = "",
  label,
  name,
  id,
  onChange,
  value,
  placeholder = "",
  required = false,
  error = "",
}: TextareaProps) {
  const [isActive, setIsActive] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const handleForm = useCallback(
    (e: SyntheticEvent<HTMLTextAreaElement>) => {
      const val = e.currentTarget.value;
      const valid = val !== "";
      setIsValid(valid);
      setIsActive(valid);
      onChange?.(e);
    },
    [onChange],
  );

  return (
    <div className={`form-group ${isActive ? "active" : ""} ${classname}`}>
      <textarea
        name={name}
        id={id}
        value={value}
        placeholder={placeholder}
        required={required}
        className={`form-control ${isValid ? "valid" : ""}`}
        onFocus={handleForm}
        onInput={handleForm}
        onChange={handleForm}
        onBlur={handleForm}
      />
      <label htmlFor={id}>{label}</label>
      {error && <div className="error">{error}</div>}
    </div>
  );
}
