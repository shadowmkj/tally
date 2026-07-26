import { ClientProblemDetailPage } from '@/components/ClientProblemDetailPage';

interface ProblemPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProblemPageProps) {
  const { id } = await params;
  return {
    title: `Problem ${id} | WECODE GCEK`,
    description: 'Solve problem on WECODE live IDE competition platform.',
  };
}

export default async function ProblemDetailPage({ params }: ProblemPageProps) {
  const { id } = await params;
  return <ClientProblemDetailPage problemId={id} />;
}
