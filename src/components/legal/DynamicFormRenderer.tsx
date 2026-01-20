import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface FormFieldSchema {
  key: string;
  label: string;
  type: "text" | "email" | "phone" | "number" | "currency" | "select" | "textarea" | "checkbox" | "date";
  required?: boolean;
  placeholder?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    format?: string;
    pattern?: string;
  };
  options?: { label: string; value: string }[];
  token?: string;
  helpText?: string;
}

export interface FormSection {
  title: string;
  fieldKeys: string[];
  description?: string;
}

export interface FormSchema {
  version: number;
  fields: FormFieldSchema[];
  ui?: {
    sections?: FormSection[];
  };
}

interface DynamicFormRendererProps {
  schema: FormSchema;
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  readOnly?: boolean;
}

export function DynamicFormRenderer({
  schema,
  values,
  onChange,
  errors = {},
  disabled = false,
  readOnly = false,
}: DynamicFormRendererProps) {
  const handleFieldChange = (key: string, value: unknown) => {
    onChange({ ...values, [key]: value });
  };

  const renderField = (field: FormFieldSchema) => {
    const value = values[field.key];
    const error = errors[field.key];
    const isDisabled = disabled || readOnly;

    const commonClasses = cn(
      error && "border-destructive",
      readOnly && "bg-muted cursor-not-allowed"
    );

    switch (field.type) {
      case "text":
      case "email":
      case "phone":
        return (
          <Input
            type={field.type === "phone" ? "tel" : field.type}
            placeholder={field.placeholder}
            value={(value as string) || ""}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            disabled={isDisabled}
            className={commonClasses}
          />
        );

      case "number":
      case "currency":
        return (
          <div className="relative">
            {field.type === "currency" && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            )}
            <Input
              type="number"
              placeholder={field.placeholder}
              value={(value as number) ?? ""}
              onChange={(e) => handleFieldChange(field.key, e.target.value ? parseFloat(e.target.value) : null)}
              disabled={isDisabled}
              className={cn(commonClasses, field.type === "currency" && "pl-7")}
              min={field.validation?.min}
              max={field.validation?.max}
            />
          </div>
        );

      case "date":
        return (
          <Input
            type="date"
            value={(value as string) || ""}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            disabled={isDisabled}
            className={commonClasses}
          />
        );

      case "textarea":
        return (
          <Textarea
            placeholder={field.placeholder}
            value={(value as string) || ""}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            disabled={isDisabled}
            className={commonClasses}
            rows={4}
          />
        );

      case "select":
        return (
          <Select
            value={(value as string) || ""}
            onValueChange={(v) => handleFieldChange(field.key, v)}
            disabled={isDisabled}
          >
            <SelectTrigger className={commonClasses}>
              <SelectValue placeholder={field.placeholder || "Select..."} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "checkbox":
        return (
          <div className="flex items-center gap-2">
            <Checkbox
              id={field.key}
              checked={(value as boolean) || false}
              onCheckedChange={(checked) => handleFieldChange(field.key, checked)}
              disabled={isDisabled}
            />
            <Label htmlFor={field.key} className="text-sm font-normal cursor-pointer">
              {field.placeholder || field.label}
            </Label>
          </div>
        );

      default:
        return <p className="text-muted-foreground text-sm">Unknown field type: {field.type}</p>;
    }
  };

  const renderFieldWithLabel = (field: FormFieldSchema) => (
    <div key={field.key} className="space-y-2">
      {field.type !== "checkbox" && (
        <Label htmlFor={field.key} className="flex items-center gap-1">
          {field.label}
          {field.required && <span className="text-destructive">*</span>}
        </Label>
      )}
      {renderField(field)}
      {field.helpText && (
        <p className="text-xs text-muted-foreground">{field.helpText}</p>
      )}
      {errors[field.key] && (
        <p className="text-xs text-destructive">{errors[field.key]}</p>
      )}
    </div>
  );

  // If sections are defined, render in sections
  if (schema.ui?.sections?.length) {
    return (
      <div className="space-y-6">
        {schema.ui.sections.map((section, idx) => {
          const sectionFields = section.fieldKeys
            .map((key) => schema.fields.find((f) => f.key === key))
            .filter(Boolean) as FormFieldSchema[];

          return (
            <Card key={idx}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{section.title}</CardTitle>
                {section.description && (
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {sectionFields.map(renderFieldWithLabel)}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  // Flat render if no sections
  return (
    <div className="space-y-4">
      {schema.fields.map(renderFieldWithLabel)}
    </div>
  );
}

// Validation helper
export function validateFormData(
  schema: FormSchema,
  values: Record<string, unknown>
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  for (const field of schema.fields) {
    const value = values[field.key];

    // Required check
    if (field.required) {
      if (value === undefined || value === null || value === "") {
        errors[field.key] = `${field.label} is required`;
        continue;
      }
    }

    // Skip further validation if empty and not required
    if (value === undefined || value === null || value === "") continue;

    // Type-specific validation
    if (field.validation) {
      if (field.type === "email" && field.validation.format === "email") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value as string)) {
          errors[field.key] = "Invalid email format";
        }
      }

      if (field.validation.minLength && (value as string).length < field.validation.minLength) {
        errors[field.key] = `Must be at least ${field.validation.minLength} characters`;
      }

      if (field.validation.maxLength && (value as string).length > field.validation.maxLength) {
        errors[field.key] = `Must be no more than ${field.validation.maxLength} characters`;
      }

      if (field.validation.min !== undefined && (value as number) < field.validation.min) {
        errors[field.key] = `Must be at least ${field.validation.min}`;
      }

      if (field.validation.max !== undefined && (value as number) > field.validation.max) {
        errors[field.key] = `Must be no more than ${field.validation.max}`;
      }

      if (field.validation.pattern) {
        const regex = new RegExp(field.validation.pattern);
        if (!regex.test(value as string)) {
          errors[field.key] = "Invalid format";
        }
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
