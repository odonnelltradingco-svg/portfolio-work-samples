'use client';
import './demo-ribbon.css';
import { SiteLink as Link } from '@/components/site-link';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

export function DemoRibbon({
  label,
  copy,
}: {
  label: string;
  copy?: {
    demo: string;
    portfolioNav: string;
    source: string;
    examples: string;
  };
}) {
  return (
    <div className="demo-ribbon">
      <span>
        {copy?.demo ?? 'Original portfolio demo'} · {label}
      </span>
      <nav
        className="demo-ribbon-links"
        aria-label={copy?.portfolioNav ?? 'Portfolio navigation'}
      >
        <a href="https://github.com/odonnelltradingco-svg/portfolio-work-samples/tree/main/web-interfaces">
          {copy?.source ?? 'View source ↗'}
        </a>
        <Link href="/">{copy?.examples ?? 'All examples ↗'}</Link>
      </nav>
    </div>
  );
}
export function Choice({
  id,
  label,
  value,
  onChange,
  options,
  language,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  language?: string;
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
        <SelectContent lang={language}>
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
