'use client';

import { Suspense } from 'react';
import TurnoContent from './TurnoContent';

export default function TurnoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-text-muted animate-pulse font-display tracking-widest text-sm uppercase">Cargando...</div>
      </div>
    }>
      <TurnoContent />
    </Suspense>
  );
}
