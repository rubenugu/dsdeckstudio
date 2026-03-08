import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDeckStore, Flashcard, StudySession } from "@/store/useDeckStore";

/** Map Supabase row → Flashcard */
function rowToCard(row: any): Flashcard {
  return {
    id:           row.id,
    category:     row.category,
    subcategory:  row.subcategory ?? "",
    front:        row.front,
    back:         row.back,
    codeExample:  row.code_example ?? undefined,
    difficulty:   row.difficulty,
    tags:         row.tags ?? [],
    created:      row.created_at,
    lastReviewed: row.last_reviewed ?? undefined,
    nextReview:   row.next_review ?? undefined,
    repetitions:  row.repetitions,
    easeFactor:   Number(row.ease_factor),
    interval:     row.interval_days,
    quality:      row.quality ?? undefined,
  };
}

/** Map Flashcard → Supabase insert row (no user_id — added at call site) */
function cardToRow(card: Flashcard) {
  return {
    id:           card.id,
    category:     card.category,
    subcategory:  card.subcategory,
    front:        card.front,
    back:         card.back,
    code_example: card.codeExample ?? null,
    difficulty:   card.difficulty,
    tags:         card.tags,
    created_at:   card.created,
    last_reviewed: card.lastReviewed ?? null,
    next_review:  card.nextReview ?? null,
    repetitions:  card.repetitions,
    ease_factor:  card.easeFactor,
    interval_days: card.interval,
    quality:      card.quality ?? null,
  };
}

export function useSupabaseSync() {
  const { user } = useAuth();
  const store    = useDeckStore();
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced]   = useState(false);
  const initialLoadDone = useRef(false);

  /** Load all cards from Supabase into the store */
  const loadCards = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("flashcards")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) { console.error("loadCards error:", error); return; }
    if (!data) return;
    store.setCards(data.map(rowToCard));
  }, [user]);

  /** Load study sessions */
  const loadSessions = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("study_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: true });

    if (error) { console.error("loadSessions error:", error); return; }
    if (!data) return;
    store.setSessions(
      data.map((r) => ({
        date:        r.date,
        reviewed:    r.cards_reviewed,
        accuracy:    r.accuracy,
        durationSec: Math.round(r.duration_minutes * 60),
      }))
    );
  }, [user]);

  /** Load user settings (streak, theme) */
  const loadSettings = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) {
      store.setStreak(data.streak ?? 0);
      store.setLastStudyDate(data.last_study_date ?? null);
      // Apply theme
      const t = data.theme as "dark" | "light";
      if (t === "light") {
        document.documentElement.classList.add("light-mode");
        document.documentElement.classList.remove("dark-mode");
        localStorage.setItem("dsdeck_theme", "light");
      }
    }
  }, [user]);

  // On login: initial full load
  useEffect(() => {
    if (!user) {
      initialLoadDone.current = false;
      return;
    }
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    (async () => {
      setSyncing(true);
      await Promise.all([loadCards(), loadSessions(), loadSettings()]);
      setSyncing(false);
      setSynced(true);
    })();
  }, [user, loadCards, loadSessions, loadSettings]);

  /** Upsert a single card */
  const upsertCard = useCallback(async (card: Flashcard) => {
    if (!user) return;
    setSyncing(true);
    const { error } = await supabase
      .from("flashcards")
      .upsert({ ...cardToRow(card), user_id: user.id });
    if (error) console.error("upsertCard error:", error);
    setSyncing(false);
  }, [user]);

  /** Delete a card */
  const deleteCard = useCallback(async (id: string) => {
    if (!user) return;
    setSyncing(true);
    const { error } = await supabase
      .from("flashcards")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) console.error("deleteCard error:", error);
    setSyncing(false);
  }, [user]);

  /** Insert a study session */
  const insertSession = useCallback(async (session: StudySession) => {
    if (!user) return;
    setSyncing(true);
    const { error } = await supabase
      .from("study_sessions")
      .insert({
        user_id:          user.id,
        date:             session.date,
        cards_reviewed:   session.reviewed,
        accuracy:         session.accuracy,
        duration_minutes: session.durationSec / 60,
      });
    if (error) console.error("insertSession error:", error);
    setSyncing(false);
  }, [user]);

  /** Upsert user settings */
  const upsertSettings = useCallback(async (
    opts: { theme?: string; streak?: number; lastStudyDate?: string | null }
  ) => {
    if (!user) return;
    setSyncing(true);
    const payload: any = { user_id: user.id, updated_at: new Date().toISOString() };
    if (opts.theme          !== undefined) payload.theme           = opts.theme;
    if (opts.streak         !== undefined) payload.streak          = opts.streak;
    if (opts.lastStudyDate  !== undefined) payload.last_study_date = opts.lastStudyDate;

    const { error } = await supabase
      .from("user_settings")
      .upsert(payload, { onConflict: "user_id" });
    if (error) console.error("upsertSettings error:", error);
    setSyncing(false);
  }, [user]);

  return { syncing, synced, upsertCard, deleteCard, insertSession, upsertSettings };
}
