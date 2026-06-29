import { UploadCloud, X, Check } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

/* Labelled field wrapper */
export function Field({ label, required, htmlFor, hint, className, children }) {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor={htmlFor}>
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/* Inline radio options (Yes / No, quartiles, etc.) */
export function OptionRadioGroup({ value, onChange, options, className, disabled }) {
  return (
    <RadioGroup
      value={value || ''}
      onValueChange={onChange}
      disabled={disabled}
      className={cn('flex flex-wrap gap-x-6 gap-y-2', className)}
    >
      {options.map((opt) => (
        <Label
          key={opt}
          className={cn('flex items-center gap-2 font-normal', disabled ? 'opacity-60' : 'cursor-pointer')}
        >
          <RadioGroupItem value={opt} />
          {opt}
        </Label>
      ))}
    </RadioGroup>
  );
}

/* Checkbox row with label */
export function CheckboxField({ checked, onChange, children, className }) {
  return (
    <label className={cn('flex cursor-pointer items-start gap-3 text-sm leading-relaxed', className)}>
      <Checkbox checked={checked} onCheckedChange={onChange} className="mt-0.5" />
      <span>{children}</span>
    </label>
  );
}

/* Drag/click file upload */
export function FileUpload({
  field,
  files,
  onAdd,
  onRemove,
  getFileName,
  accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png',
}) {
  const inputId = `file-${field}`;
  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-muted/30 px-4 py-6 text-center transition-colors hover:border-primary/50 hover:bg-accent"
      >
        <UploadCloud className="size-6 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Click to upload files</span>
        <span className="text-xs text-muted-foreground">PDF, DOC, DOCX, JPG, PNG (max 5 files)</span>
        <input
          id={inputId}
          type="file"
          multiple
          accept={accept}
          className="hidden"
          onChange={(e) => onAdd(field, e.target.files)}
        />
      </label>
      {files?.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((file, index) => (
            <li
              key={index}
              className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm"
            >
              <span className="truncate">{getFileName(file)}</span>
              <button
                type="button"
                onClick={() => onRemove(field, index)}
                className="text-muted-foreground transition-colors hover:text-destructive"
                aria-label="Remove file"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* Horizontal step indicator */
export function StepIndicator({ steps, currentStep, onStepClick }) {
  return (
    <ol className="flex items-center gap-1 overflow-x-auto pb-2">
      {steps.map((step, idx) => {
        const isActive = currentStep === step.id;
        const isComplete = currentStep > step.id;
        const clickable = onStepClick && step.id <= currentStep;
        return (
          <li key={step.id} className="flex shrink-0 items-center">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStepClick(step.id)}
              className={cn(
                'flex items-center gap-2 rounded-full px-2.5 py-1 transition-colors',
                clickable && 'cursor-pointer hover:bg-accent',
                !clickable && 'cursor-default'
              )}
            >
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                  isActive && 'border-primary bg-primary text-primary-foreground',
                  isComplete && 'border-primary bg-primary/10 text-primary',
                  !isActive && !isComplete && 'border-border bg-card text-muted-foreground'
                )}
              >
                {isComplete ? <Check className="size-3.5" /> : step.id}
              </span>
              <span
                className={cn(
                  'hidden whitespace-nowrap text-xs font-medium lg:inline',
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {step.title}
              </span>
            </button>
            {idx < steps.length - 1 && (
              <span className={cn('mx-1 h-px w-4 shrink-0', isComplete ? 'bg-primary/40' : 'bg-border')} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/* Section heading inside a step */
export function StepHeading({ title, description }) {
  return (
    <div className="space-y-1">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
