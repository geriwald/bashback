export interface Correction {
  message: string;
  replacement: string;
  offset: number;
  length: number;
  original: string;
}

interface LTMatch {
  message: string;
  offset: number;
  length: number;
  replacements: { value: string }[];
  context: { text: string; offset: number; length: number };
}

interface LTResponse {
  matches: LTMatch[];
}

export async function checkSpelling(text: string, language = 'fr'): Promise<Correction[]> {
  try {
    const body = new URLSearchParams({ text, language });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('https://api.languagetool.org/v2/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as LTResponse;

    return data.matches.map((match) => ({
      message: match.message,
      replacement: match.replacements[0]?.value ?? '',
      offset: match.offset,
      length: match.length,
      original: text.slice(match.offset, match.offset + match.length),
    }));
  } catch {
    return [];
  }
}
