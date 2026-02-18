import { getContent } from '@/actions/content';
import ContentEditor from '@/components/admin/ContentEditor';

export const metadata = { title: 'Edit Content – Admin' };
export const dynamic = 'force-dynamic';

export default async function AdminContentPage() {
  const content = await getContent();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Site Content</h2>
      <p className="text-sm text-gray-500">
        Changes are saved to the database and reflected on the public site immediately.
      </p>
      <ContentEditor initialContent={content} />
    </div>
  );
}
