import type { Metadata } from 'next';
import './home-care.css';

export const metadata: Metadata = {
  title: 'Sunday Home | Interactive Cleaning Website Demo',
  description:
    'An original residential cleaning website with transparent sample pricing, recurring-visit comparisons and an interactive clean preview. A portfolio project by Pierce O’Donnell.',
};

export default function HomeCareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
