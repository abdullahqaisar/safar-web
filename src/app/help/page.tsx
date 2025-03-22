import { Metadata } from 'next';
import HelpPageContent from '@/features/help/components/HelpPageContent';

export const metadata: Metadata = {
  title: 'Help & Support | Safar',
  description:
    'Get help with using Safar, troubleshoot issues, find answers to common questions, and learn how to get the most out of your public transportation experience.',
};

export default function HelpPage() {
  return <HelpPageContent />;
}
