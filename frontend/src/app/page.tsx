'use client';

import { AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import CameraModule from '@/components/CameraModule';
import CropEditor from '@/components/CropEditor';
import ExportManager from '@/components/ExportManager';
import StripDesigner from '@/components/StripDesigner';
import WelcomeScreen from '@/components/WelcomeScreen';
import { Aurora } from '@/components/ui';
import { useBooth } from '@/services/store';
import { THEMES } from '@/utils/design';

export default function BoothPage() {
  const { screen, theme, hydrated, hydrate } = useBooth();

  // localStorage only exists on the client — hydrate after mount to keep SSR stable.
  useEffect(() => {
    if (!hydrated) hydrate();
    if (process.env.NODE_ENV === 'development') {
      void import('@/utils/selftest').then((m) => m.runSelfTest()).catch(() => {});
    }
  }, [hydrated, hydrate]);

  const th = THEMES[theme];

  return (
    <main
      className="relative min-h-[100dvh] overflow-x-hidden bg-[#F4F1EC]"
      style={{ ['--accent' as string]: th.accent }}
    >
      <Aurora accent={th.accent} glow={th.glow} />

      <AnimatePresence mode="wait">
        {screen === 'welcome' && <WelcomeScreen key="welcome" />}
        {screen === 'capture' && <CameraModule key="capture" />}
        {screen === 'review' && <CropEditor key="review" />}
        {screen === 'design' && <StripDesigner key="design" />}
        {screen === 'final' && <ExportManager key="final" />}
      </AnimatePresence>
    </main>
  );
}
