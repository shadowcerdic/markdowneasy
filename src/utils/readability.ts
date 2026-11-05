/**
 * iA Writer-style Readability and Syntax Analysis Engine
 */

export interface ReadabilityMetrics {
  fleschScore: number;
  readingEase: string;
  gradeLevel: string;
  sentenceCount: number;
  avgSentenceWords: number;
  complexWords: number;
  complexWordsRatio: number;
}

function countSyllables(word: string): number {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (clean.length <= 3) return 1;

  const syllables = clean
    .replace(/(?:[^laeiouy]|ed|es|e)$/, '')
    .replace(/^y/, '')
    .match(/[aeiouy]{1,2}/g);

  return syllables ? syllables.length : 1;
}

export function computeReadability(text: string): ReadabilityMetrics {
  if (!text || !text.trim()) {
    return {
      fleschScore: 100,
      readingEase: 'Very Easy',
      gradeLevel: 'Grade 5',
      sentenceCount: 0,
      avgSentenceWords: 0,
      complexWords: 0,
      complexWordsRatio: 0,
    };
  }

  // Strip code blocks and markdown headings
  const plainText = text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^#{1,6}\s+.+$/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_~`]/g, '');

  const sentences = plainText
    .split(/[.!?؟]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const sentenceCount = Math.max(1, sentences.length);
  const words = plainText.match(/[\p{L}\p{N}]+/gu) || [];
  const wordCount = Math.max(1, words.length);

  let totalSyllables = 0;
  let complexWords = 0;

  for (const word of words) {
    const syl = countSyllables(word);
    totalSyllables += syl;
    if (syl >= 3) {
      complexWords++;
    }
  }

  const wordsPerSentence = wordCount / sentenceCount;
  const syllablesPerWord = totalSyllables / wordCount;

  // Flesch Reading Ease Formula: 206.835 - 1.015 * (words/sentences) - 84.6 * (syllables/words)
  const rawScore = 206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord;
  const fleschScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  let readingEase = 'Standard';
  let gradeLevel = 'Grade 8-9';

  if (fleschScore >= 90) {
    readingEase = 'Very Easy';
    gradeLevel = 'Grade 5';
  } else if (fleschScore >= 80) {
    readingEase = 'Easy';
    gradeLevel = 'Grade 6';
  } else if (fleschScore >= 70) {
    readingEase = 'Fairly Easy';
    gradeLevel = 'Grade 7';
  } else if (fleschScore >= 60) {
    readingEase = 'Standard';
    gradeLevel = 'Grade 8-9';
  } else if (fleschScore >= 50) {
    readingEase = 'Fairly Difficult';
    gradeLevel = 'High School';
  } else if (fleschScore >= 30) {
    readingEase = 'Difficult';
    gradeLevel = 'College';
  } else {
    readingEase = 'Very Confusing';
    gradeLevel = 'Graduate Level';
  }

  return {
    fleschScore,
    readingEase,
    gradeLevel,
    sentenceCount,
    avgSentenceWords: Math.round(wordsPerSentence * 10) / 10,
    complexWords,
    complexWordsRatio: Math.round((complexWords / wordCount) * 100),
  };
}
