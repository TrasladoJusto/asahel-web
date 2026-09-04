import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { caseStudies } from '@/lib/case-studies';
import { CaseStudyHero } from '@/components/case-study/CaseStudyHero';
import { CaseStudyContent } from '@/components/case-study/CaseStudyContent';
import { TechStack } from '@/components/case-study/TechStack';
import { KeyDecisions } from '@/components/case-study/KeyDecisions';
import { Outcome } from '@/components/case-study/Outcome';


export async function generateStaticParams() {
  return caseStudies.map((cs) => ({ slug: cs.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const study = caseStudies.find((cs) => cs.slug === slug);
  
  if (!study) return { title: 'No encontrado' };
  
  return {
    title: `${study.title} | Asahel`,
    description: study.shortDescription,
    openGraph: {
      title: study.title,
      description: study.shortDescription,
      images: [{ url: study.thumbnail, width: 1200, height: 675 }],
    },
  };
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const study = caseStudies.find((cs) => cs.slug === slug);
  
  if (!study) notFound();
  
  return (
    <main id="main-content" className="min-h-screen bg-[var(--bg)]">
      <Navbar />
      <CaseStudyHero study={study} />
      <CaseStudyContent study={study} />
      <TechStack techStack={study.techStack} />
      <KeyDecisions decisions={study.keyDecisions} />
      <Outcome outcome={study.outcome} />
      <Footer />
    </main>
  );
}