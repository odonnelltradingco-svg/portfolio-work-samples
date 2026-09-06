'use client';

import { useCallback, useId, useState } from 'react';
import { Copy, Download, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import './export-preview.css';

export function ExportPreview({
  text,
  filename,
  type = 'text/plain',
  title,
  description,
  label = 'Export',
  className = '',
  disabled = false,
}: {
  text: string;
  filename: string;
  type?: string;
  title: string;
  description: string;
  label?: string;
  className?: string;
  disabled?: boolean;
}) {
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const previewId = useId();
  const downloadRef = useCallback(
    (node: HTMLAnchorElement | null) => {
      if (!node) return;
      const url = URL.createObjectURL(
        new Blob([text], { type: `${type};charset=utf-8` }),
      );
      node.href = url;
      // Keep the native download target alive while the browser resolves it.
      return () => URL.revokeObjectURL(url);
    },
    [text, type],
  );
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setMessage('Copied to your clipboard.');
    } catch {
      setCopied(false);
      setMessage(
        'Copy is unavailable here. Select the preview text or use the download link.',
      );
    }
  }
  return (
    <Dialog
      onOpenChange={() => {
        setMessage('');
        setCopied(false);
      }}
    >
      <DialogTrigger
        render={
          <Button variant="outline" className={className} disabled={disabled} />
        }
      >
        <Download size={18} aria-hidden="true" />
        {label}
      </DialogTrigger>
      <DialogContent className="export-preview">
        <DialogTitle className="export-title">{title}</DialogTitle>
        <DialogDescription className="export-description">
          {description}
        </DialogDescription>
        <div className="export-file">
          <span>{filename}</span>
          <span>UTF-8 text</span>
        </div>
        <label htmlFor={previewId} className="sr-only">
          File preview
        </label>
        <Textarea
          id={previewId}
          className="export-content"
          value={text}
          readOnly
          spellCheck={false}
        />
        <div className="export-actions">
          <a
            ref={downloadRef}
            href={'#' + previewId}
            download={filename}
            className="primary-button"
            onClick={() => {
              setMessage(
                'Download requested. Check your browser’s downloads; you can also copy the preview.',
              );
            }}
          >
            <Download size={18} aria-hidden="true" />
            Download file
          </a>
          <Button variant="outline" onClick={copy}>
            {copied ? (
              <Check size={18} aria-hidden="true" />
            ) : (
              <Copy size={18} aria-hidden="true" />
            )}
            Copy text
          </Button>
        </div>
        <output className="export-message" aria-live="polite">
          {message ||
            'The file contains the information shown in this preview.'}
        </output>
      </DialogContent>
    </Dialog>
  );
}
