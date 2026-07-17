import React, { useState, useEffect } from 'react';
import { useDatabase } from '../../context/ServiceContext';

/**
 * LiveRegion component that tracks newly generated operational events
 * and announces them to assistive screen readers via aria-live.
 */
export const LiveRegion: React.FC = () => {
  const db = useDatabase();
  const [announcement, setAnnouncement] = useState<string>('');

  useEffect(() => {
    let lastSeenId: string | null = null;

    const unsubscribe = db.listenToEvents(
      (events) => {
        if (events.length > 0) {
          const latest = events[0];
          if (latest.id !== lastSeenId) {
            lastSeenId = latest.id;
            const level = latest.severity.toUpperCase();
            const actionText = latest.recommendedActions.fan || latest.recommendedActions.organizer;
            setAnnouncement(
              `Operational Alert: ${latest.type.replace('_', ' ')} detected. Severity is ${level}. AI Rationale: ${latest.rationale}. Recommended action: ${actionText}`,
            );
          }
        }
      },
      () => {},
    );

    return () => unsubscribe();
  }, [db]);

  return (
    <div className="sr-only" aria-live="polite" aria-atomic="true">
      {announcement}
    </div>
  );
};
