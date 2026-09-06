import type { Metadata } from 'next';
import './data-cleanup.css';

export const metadata: Metadata = {
  title: "Orderly | CSV Cleanup Demo by Pierce O'Donnell",
  description:
    'Try an original CSV validation workflow: traceable exceptions, normalized orders and reconciled USD totals. Processing stays in your browser.',
};
export default function CleanupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
