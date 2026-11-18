import { Link } from 'react-router-dom';
import { Lightbulb } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer.jsx';
import { Card } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';

export default function NotFoundPage() {
  return (
    <PageContainer title="Page not found">
      <Card>
        <EmptyState
          icon={Lightbulb}
          title="This page doesn't exist"
          description="The link may be broken or the page may have moved."
          action={<Link to="/" className="inline-flex h-10 items-center rounded-lg bg-brand-primary px-4 text-sm font-semibold text-on-brand hover:bg-brand-hover">Back to dashboard</Link>}
        />
      </Card>
    </PageContainer>
  );
}
