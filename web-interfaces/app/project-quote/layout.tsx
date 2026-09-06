import type { Metadata } from 'next';
import './project-quote.css';
export const metadata: Metadata = {
  title: 'Scope Studio | Interactive Project Brief Demo',
  description:
    'Build a sample project brief with itemized estimates, clear validation and a downloadable outline. An original portfolio demonstration by Pierce O’Donnell.',
};
export default function QuoteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
