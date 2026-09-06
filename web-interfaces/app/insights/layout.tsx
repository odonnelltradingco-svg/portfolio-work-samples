import type { Metadata } from 'next';
import './insights.css';
export const metadata: Metadata = {
  title: 'Fieldnote | Interactive Reporting Dashboard Demo',
  description:
    'Explore a sample sales dashboard with linked filters, paid-order metrics, record details and a previewable CSV export. An original portfolio project by Pierce O’Donnell.',
};
export default function InsightsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
