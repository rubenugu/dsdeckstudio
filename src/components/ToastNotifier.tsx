import { useEffect } from "react";
import { useDeckStore } from "@/store/useDeckStore";
import { getDueCards } from "@/utils/sm2";
import { toast } from "@/hooks/use-toast";

/**
 * Fires toast reminders:
 *  - On mount: if due cards > 0 → info toast
 *  - On mount: if streak > 0 and last study was yesterday → warning toast
 */
export function ToastNotifier() {
  const { cards, streak, lastStudyDate, studySessions } = useDeckStore();

  useEffect(() => {
    const due = getDueCards(cards).length;
    const shown = sessionStorage.getItem("dsdeck_toasts_shown");
    if (shown) return;
    sessionStorage.setItem("dsdeck_toasts_shown", "1");

    // Due cards reminder
    if (due > 0) {
      setTimeout(() => {
        toast({
          title: `⏰ ${due} card${due !== 1 ? "s" : ""} due for review`,
          description: "Head to Study to keep your streak alive.",
          duration: 5000,
        });
      }, 1200);
    }

    // Streak at risk (last study was yesterday or earlier, streak > 0)
    if (streak > 0 && lastStudyDate) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toDateString();
      if (lastStudyDate === yesterday) {
        setTimeout(() => {
          toast({
            title: `🔥 Streak at risk — ${streak} day${streak !== 1 ? "s" : ""}!`,
            description: "Study at least one card today to keep your streak.",
            duration: 6000,
          });
        }, 2500);
      }
    }
  }, []);

  // Session completed → fired from StudyPage via store subscription
  useEffect(() => {
    if (!studySessions || studySessions.length === 0) return;
    const last = studySessions[studySessions.length - 1];
    // Only toast if session was in last 3 seconds (just completed)
    const age = Date.now() - new Date(last.date).getTime();
    if (age < 3000) {
      toast({
        title: `✅ Session complete!`,
        description: `Reviewed ${last.reviewed} card${last.reviewed !== 1 ? "s" : ""} · ${last.accuracy}% accuracy`,
        duration: 4000,
      });
    }
  }, [studySessions?.length]);

  return null;
}
