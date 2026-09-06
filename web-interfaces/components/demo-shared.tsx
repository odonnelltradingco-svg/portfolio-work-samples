'use client';
import { SiteLink as Link } from '@/components/site-link';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

export function DemoRibbon({ label }: { label: string }) {
  return (
    <div className="demo-ribbon">
      <span>Original portfolio demo · {label}</span>
      <Link href="/">All examples ↗</Link>
    </div>
  );
}
export function Choice({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label htmlFor={id} id={id + '-label'} className="field-label">
        {label}
      </label>
      <Select
        value={value}
        onValueChange={(next) => {
          if (next !== null) onChange(next);
        }}
        items={options}
      >
        <SelectTrigger
          id={id}
          aria-labelledby={id + '-label'}
          className="demo-select"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
