import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

export interface TokenizedInput {
  inputIds: number[];
  attentionMask: number[];
  tokenTypeIds: number[];
}

const VOCAB_ASSET = require('@/assets/models/sbert/vocab.txt');
const CLS_TOKEN = '[CLS]';
const SEP_TOKEN = '[SEP]';
const PAD_TOKEN = '[PAD]';
const UNK_TOKEN = '[UNK]';
const MAX_INPUT_CHARS_PER_WORD = 100;

let vocab: string[] | null = null;
let vocabMap: Map<string, number> | null = null;
let unkId = 0;
let padId = 0;

async function loadVocab(): Promise<Map<string, number>> {
  if (vocabMap) return vocabMap;

  const asset = Asset.fromModule(VOCAB_ASSET);
  if (!asset.localUri) {
    await asset.downloadAsync();
  }
  const uri = asset.localUri || asset.uri;
  const text = await FileSystem.readAsStringAsync(uri);
  const tokens = text.split(/\r?\n/).filter(Boolean);

  vocab = tokens;
  vocabMap = new Map(tokens.map((t, i) => [t, i]));
  unkId = vocabMap.get(UNK_TOKEN) ?? 0;
  padId = vocabMap.get(PAD_TOKEN) ?? 0;

  return vocabMap;
}

function isWhitespace(code: number): boolean {
  return (
    code === 0x20 ||
    code === 0x09 ||
    code === 0x0a ||
    code === 0x0d ||
    code === 0x85 ||
    code === 0xa0
  );
}

function isControl(code: number): boolean {
  if (isWhitespace(code)) return false;
  return (code >= 0 && code <= 0x1f) || (code >= 0x7f && code <= 0x9f);
}

function isPunctuation(code: number): boolean {
  if (
    (code >= 33 && code <= 47) ||
    (code >= 58 && code <= 64) ||
    (code >= 91 && code <= 96) ||
    (code >= 123 && code <= 126)
  ) {
    return true;
  }
  // General punctuation blocks
  return (
    (code >= 0x2000 && code <= 0x206f) ||
    (code >= 0x3000 && code <= 0x303f) ||
    (code >= 0xfe30 && code <= 0xfe4f) ||
    (code >= 0xff00 && code <= 0xff65)
  );
}

function isChineseChar(code: number): boolean {
  return (
    (code >= 0x4e00 && code <= 0x9fff) ||
    (code >= 0x3400 && code <= 0x4dbf) ||
    (code >= 0x20000 && code <= 0x2a6df) ||
    (code >= 0x2a700 && code <= 0x2b73f) ||
    (code >= 0x2b740 && code <= 0x2b81f) ||
    (code >= 0x2b820 && code <= 0x2ceaf) ||
    (code >= 0xf900 && code <= 0xfaff) ||
    (code >= 0x2f800 && code <= 0x2fa1f)
  );
}

function cleanText(text: string): string {
  const out: string[] = [];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (isControl(code)) continue;
    if (isWhitespace(code)) {
      out.push(' ');
    } else {
      out.push(text[i]);
    }
  }
  return out.join('');
}

function stripAccents(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function tokenizeChineseChars(text: string): string {
  const out: string[] = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const code = ch.charCodeAt(0);
    if (isChineseChar(code)) {
      out.push(' ');
      out.push(ch);
      out.push(' ');
    } else {
      out.push(ch);
    }
  }
  return out.join('');
}

function splitOnPunc(token: string): string[] {
  const out: string[] = [];
  let buff = '';
  for (let i = 0; i < token.length; i++) {
    const ch = token[i];
    const code = ch.charCodeAt(0);
    if (isPunctuation(code)) {
      if (buff) {
        out.push(buff);
        buff = '';
      }
      out.push(ch);
    } else {
      buff += ch;
    }
  }
  if (buff) out.push(buff);
  return out;
}

function basicTokenize(text: string): string[] {
  let cleaned = cleanText(text);
  cleaned = tokenizeChineseChars(cleaned);
  cleaned = cleaned.toLowerCase();
  cleaned = stripAccents(cleaned);

  const origTokens = cleaned.split(/\s+/).filter(Boolean);
  const splitTokens: string[] = [];
  for (const token of origTokens) {
    splitTokens.push(...splitOnPunc(token));
  }
  return splitTokens.filter(Boolean);
}
//分词
function wordpieceTokenize(token: string, vocabLookup: Map<string, number>): string[] {
  if (token.length > MAX_INPUT_CHARS_PER_WORD) return [UNK_TOKEN];
  if (vocabLookup.has(token)) return [token];

  const chars = [...token];
  const subTokens: string[] = [];
  let start = 0;

  while (start < chars.length) {
    let end = chars.length;
    let curSubstr: string | null = null;

    while (start < end) {
      let substr = chars.slice(start, end).join('');
      if (start > 0) substr = `##${substr}`;
      if (vocabLookup.has(substr)) {
        curSubstr = substr;
        break;
      }
      end -= 1;
    }

    if (curSubstr === null) return [UNK_TOKEN];
    subTokens.push(curSubstr);
    start = end;
  }

  return subTokens;
}

//将文字变成bert输入格式：[CLS] 句子 [SEP]
export async function encodeText(text: string, maxLen = 128): Promise<TokenizedInput> {
  const vocabLookup = await loadVocab();

  const basic = basicTokenize(text);
  const wp: string[] = [];
  for (const token of basic) {
    wp.push(...wordpieceTokenize(token, vocabLookup));
  }

  let tokens = wp;
  const maxTokens = Math.max(1, maxLen - 2);
  if (tokens.length > maxTokens) tokens = tokens.slice(0, maxTokens);

  const finalTokens = [CLS_TOKEN, ...tokens, SEP_TOKEN];
  const inputIds = finalTokens.map((t) => vocabLookup.get(t) ?? unkId);
  const attentionMask = new Array(inputIds.length).fill(1);
  const tokenTypeIds = new Array(inputIds.length).fill(0);

  while (inputIds.length < maxLen) {
    inputIds.push(padId);
    attentionMask.push(0);
    tokenTypeIds.push(0);
  }

  return { inputIds, attentionMask, tokenTypeIds };
}
