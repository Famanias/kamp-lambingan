'use client';

import dynamic from 'next/dynamic';
import { SiteContent } from '@/lib/types';

const ChatWidget = dynamic(() => import('./ChatWidget'), {
  ssr: false,
});

export default function ChatWidgetWrapper({ content }: { content: SiteContent }) {
  return <ChatWidget content={content} />;
}
