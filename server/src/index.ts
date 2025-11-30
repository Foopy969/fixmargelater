import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';
import OpenAI from 'openai';
import dictionary from '../data/dictionary.json';
import fs from 'fs';
import { promises as fsPromises } from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL, // optional; remove if using default
});

type Entry = {
  key: string;
  value: string;
};

const entries = dictionary as Entry[];

const dict: Record<string, string> = {};

for (const { key, value } of entries) {
  dict[key] = value;
}

const app = express();
const port = Number.parseInt(process.env.PORT ?? '5000', 10);

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// -------- Persistent translation cache --------

const CACHE_FILE = path.resolve(__dirname, '../data/translation-cache.json');

// in-memory map of tags -> translated text
let translationCache: Record<string, string> = {};

// Load cache from disk at startup
try {
  if (fs.existsSync(CACHE_FILE)) {
    const raw = fs.readFileSync(CACHE_FILE, 'utf8');
    translationCache = JSON.parse(raw);
    console.log(
      `Loaded ${Object.keys(translationCache).length} cached translations from ${CACHE_FILE}`,
    );
  } else {
    console.log('No existing translation cache file found, starting empty.');
  }
} catch (e) {
  console.error('Failed to load translation cache:', e);
  translationCache = {};
}

async function saveCacheToDisk() {
  try {
    await fsPromises.writeFile(
      CACHE_FILE,
      JSON.stringify(translationCache, null, 2),
      'utf8',
    );
  } catch (e) {
    console.error('Failed to save translation cache:', e);
  }
}

// -------- Your existing logic --------

function textToTags(fromText: string): string {
  const keys = Object.keys(dict);

  const normalizedText = fromText
    .replace(/’/g, "'")
    .replace(/〜/g, '~');

  let result = '';

  for (let i = 0; i < normalizedText.length; ) {
    let matched = false;

    for (const key of keys) {
      const len = key.length;

      if (i + len <= normalizedText.length && normalizedText.startsWith(key, i)) {
        result += `[${dict[key]}]`;
        i += len;
        matched = true;
        break;
      }
    }

    if (!matched) {
      result += normalizedText[i];
      i += 1;
    }
  }

  return result;
}

async function tagsToText(tags: string): Promise<string> {
  const agent = await openai.responses.create({
    model: 'openai/gpt-oss-120b',
    reasoning: { effort: 'low' },
    input: [
      {
        role: 'system',
        content: [
          '未知の言語で書かれたテキストが、意味語を含むタグに変換されました。',
          'あなたの任務は、それらのタグの意味に合致する理解可能な日本語を構築することです。',
          'それ以外のことを伝えようとはしないでください。',
        ].join(' '),
      },
      {
        role: 'user',
        content: tags,
      },
    ],
  });

  return agent.output_text;
}

app.post('/translate', async (req, res) => {
  const { text } = req.body as {
    text?: string;
  };

  if (typeof text !== 'string') {
    return res.status(400).json({ error: 'text must be a string' });
  }

  try {
    const tags = textToTags(text);

    // detect unknown words
    const re: RegExp = /[^(\]\s\n)]{3,}(?=(?:[^\]]*\[[^\[]*])*[^\]\[]*$)/g;
    const matches = tags.match(re);

    if (matches && matches.length > 0) {
      const csv = matches
        .map((m) => m.trim())
        .filter((m) => m.length > 0)
        .join(',\n');

      return res.json({
        text: `Unknown word(s) detected, please check your spelling and casing:\n${csv}`,
      });
    }

    // ---- cache check by tags ----
    const cached = translationCache[tags];
    if (cached) {
      return res.json({ text: cached, cached: true });
    }

    // no cache → call model
    const translated = await tagsToText(tags);

    // store in memory
    translationCache[tags] = translated;

    // persist (don’t await in handler if you prefer fire-and-forget)
    saveCacheToDisk().catch((e) =>
      console.error('Error while saving cache:', e),
    );

    return res.json({ text: translated, cached: false });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error while translating.' });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
