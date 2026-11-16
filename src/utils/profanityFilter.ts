/**
 * PEL Sporcu Ahlakı & Küfür / Argo Filtreleme Motoru
 * (Athlete Sportsmanship & Profanity Filtering Engine)
 *
 * Sürüş başlıkları, notlar, sohbet iletileri ve koleksiyon adlarında
 * saygılı ve sporcu ahlakına uygun bir dil kullanılmasını sağlar.
 */

// Turkish and multilingual profanity / vulgarity dictionary
const BLACKLISTED_TERMS = [
  // Türkçe temel küfürler ve türevleri
  'amk',
  'aq',
  'amq',
  'sik',
  'sikeyim',
  'siktir',
  'sikiş',
  'sikik',
  'orospu',
  'oruspu',
  'piç',
  'pic',
  'göt',
  'got',
  'götveren',
  'amcık',
  'amcik',
  'yarrak',
  'yarak',
  'taşak',
  'tasak',
  'ibne',
  'puşt',
  'pust',
  'kahpe',
  'orospuçocuğu',
  'orospucocugu',
  'ananı',
  'anani',
  'ananın',
  'ananin',
  'bacını',
  'bacini',
  'pezevenk',
  'yavşak',
  'yavsak',
  'dalyarak',
  'cibiliyetini',
  'sülaleni',
  'sulaleni',
  'bok',
  'boktan',
  'amına',
  'amina',
  'amina koyim',
  'amına koyayım',
  'amk çocuğu',
  
  // English common profanities
  'fuck',
  'fucking',
  'fucker',
  'shit',
  'bitch',
  'asshole',
  'cunt',
  'dick',
  'bastard',
  'motherfucker',
  'whore',
  'slut'
];

// Leetspeak character mapping
const LEET_MAP: Record<string, string> = {
  '@': 'a',
  '4': 'a',
  '8': 'b',
  '3': 'e',
  '1': 'i',
  '!': 'i',
  '|': 'i',
  '0': 'o',
  '5': 's',
  '$': 's',
  '7': 't',
  'v': 'u'
};

/**
 * Normalizes text by removing non-alphanumeric chars, converting leetspeak,
 * and collapsing repeated letters.
 */
function normalizeText(text: string): string {
  if (!text) return '';
  let str = text.toLocaleLowerCase('tr-TR');

  // Replace leet characters
  str = str
    .split('')
    .map((char) => LEET_MAP[char] || char)
    .join('');

  // Turkish character normalization for matching
  str = str
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');

  // Collapse consecutive duplicate characters: "siiikkk" -> "sik"
  str = str.replace(/(.)\1{2,}/g, '$1$1');

  return str;
}

/**
 * Checks if a text contains any blacklisted vulgar words.
 */
export function containsProfanity(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const normalized = normalizeText(text);

  // Check whole words or prominent substrings
  for (const word of BLACKLISTED_TERMS) {
    // Regex for word boundary or isolated slang
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(normalized)) {
      return true;
    }

    // Direct substring check for severe compound insults
    if (word.length >= 4 && normalized.includes(word)) {
      return true;
    }
  }

  return false;
}

/**
 * Replaces offensive words in the text with asterisks preserving original formatting.
 */
export function cleanProfanity(text: string, maskChar = '*'): string {
  if (!text || typeof text !== 'string') return '';
  let result = text;

  for (const word of BLACKLISTED_TERMS) {
    // Construct regex that is forgiving with letters and accents
    const pattern = new RegExp(`(?<=^|\\s|[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ])${word}(?=[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ]|\\s|$)`, 'gi');
    result = result.replace(pattern, (match) => maskChar.repeat(match.length));

    // Also match simple occurrences if longer word
    if (word.length >= 4) {
      const subPattern = new RegExp(word, 'gi');
      result = result.replace(subPattern, (match) => maskChar.repeat(match.length));
    }
  }

  return result;
}

/**
 * Validates text and returns detailed status with suggestions.
 */
export function validateContent(text: string): {
  isValid: boolean;
  sanitized: string;
  flaggedWords: string[];
  warningMessage?: string;
} {
  const flaggedWords: string[] = [];
  const normalized = normalizeText(text);

  for (const word of BLACKLISTED_TERMS) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(normalized) || (word.length >= 4 && normalized.includes(word))) {
      flaggedWords.push(word);
    }
  }

  const isValid = flaggedWords.length === 0;
  const sanitized = cleanProfanity(text);

  return {
    isValid,
    sanitized,
    flaggedWords,
    warningMessage: isValid
      ? undefined
      : 'İçerik sporcu ahlakı ve saygı kurallarına aykırı ifadeler içeriyor, otomatik sansür uygulandı.'
  };
}
