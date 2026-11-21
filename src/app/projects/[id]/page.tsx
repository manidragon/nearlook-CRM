'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ProjectDetailsRedirect() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    if (params?.id) {
      router.replace(`/projects?openProjectId=${params.id}`);
    } else {
      router.replace('/projects');
    }
  }, [params, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm text-slate-500 font-medium">Opening Project Workspace...</p>
    </div>
  );
}
