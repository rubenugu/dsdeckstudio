import type { Flashcard } from "@/store/useDeckStore";

/**
 * SM-2 Spaced Repetition Algorithm
 * quality: 0–5  (0 = blackout, 3 = correct with difficulty, 5 = perfect recall)
 */
export function calculateNextReview(
  card: Flashcard,
  quality: number
): Partial<Flashcard> {
  let { easeFactor, interval, repetitions } = card;

  if (quality >= 3) {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);

    repetitions += 1;
  } else {
    repetitions = 0;
    interval = 1;
  }

  easeFactor = Math.max(
    1.3,
    easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  );

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    easeFactor,
    interval,
    repetitions,
    lastReviewed: new Date().toISOString(),
    nextReview: nextReview.toISOString(),
    quality,
  };
}

export function getDueCards(cards: Flashcard[]): Flashcard[] {
  const now = new Date();
  return cards.filter(
    (c) => !c.nextReview || new Date(c.nextReview) <= now
  );
}
