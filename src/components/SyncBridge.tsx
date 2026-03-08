/**
 * SyncBridge — sits inside the app, wires Supabase sync callbacks
 * into store actions so every add/update/delete/review is mirrored.
 */
import { useEffect, useRef } from "react";
import { useDeckStore, Flashcard, StudySession } from "@/store/useDeckStore";
import { useSupabaseSync } from "@/hooks/useSupabaseSync";
import { useAuth } from "@/contexts/AuthContext";

export function SyncBridge() {
  const { user } = useAuth();
  const store = useDeckStore();
  const { upsertCard, deleteCard, insertSession, upsertSettings, syncing } = useSupabaseSync();

  // Expose sync helpers on the store-like context via module-level refs
  // so StudyPage / AddCardPage can call them after store mutations.
  useEffect(() => {
    SyncBridge.upsertCard    = upsertCard;
    SyncBridge.deleteCard    = deleteCard;
    SyncBridge.insertSession = insertSession;
    SyncBridge.upsertSettings = upsertSettings;
    SyncBridge.syncing       = syncing;
    SyncBridge.isLoggedIn    = !!user;
  });

  return null;
}

// Static refs — populated on every render so other components can import them
SyncBridge.upsertCard     = async (_card: Flashcard) => {};
SyncBridge.deleteCard     = async (_id: string) => {};
SyncBridge.insertSession  = async (_s: StudySession) => {};
SyncBridge.upsertSettings = async (_opts: { theme?: string; streak?: number; lastStudyDate?: string | null }) => {};
SyncBridge.syncing        = false;
SyncBridge.isLoggedIn     = false;
