const symbols = "1234567890!@#$%^&*()-=_+[]{};\"|;'\\<>?/.,~`";

const guffParenWords = [
  "a cappella",
  "acoustic",
  "bonus",
  "censored",
  "clean",
  "club",
  "clubmix",
  "composition",
  "cut",
  "dance",
  "demo",
  "dialogue",
  "dirty",
  "edit",
  "excerpt",
  "explicit",
  "extended",
  "instrumental",
  "interlude",
  "intro",
  "karaoke",
  "live",
  "long",
  "main",
  "maxi",
  "megamix",
  "mix",
  "mono",
  "official",
  "orchestral",
  "original",
  "outro",
  "outtake",
  "outtakes",
  "piano",
  "quadraphonic",
  "radio",
  "rap",
  "re-edit",
  "reedit",
  "refix",
  "rehearsal",
  "reinterpreted",
  "released",
  "release",
  "remake",
  "remastered",
  "remaster",
  "master",
  "remix",
  "remixed",
  "remode",
  "reprise",
  "rework",
  "reworked",
  "rmx",
  "session",
  "short",
  "single",
  "skit",
  "stereo",
  "studio",
  "take",
  "takes",
  "tape",
  "track",
  "tryout",
  "uncensored",
  "unknown",
  "unplugged",
  "untitled",
  "version",
  "ver",
  "video",
  "vocal",
  "vs",
  "with",
  "without",
];

export class MetadataCleaner {
  private recordingPatterns: RegExp[];
  private artistPatterns: RegExp[];
  private parenGuffExpr: RegExp;
  private preferredScript: string;

  constructor(preferredScript: string = "Latin") {
    this.preferredScript = preferredScript;

    this.recordingPatterns = [
      /(?<title>.+?)\s+(?<enclosed>\(.+\)|\[.+\]|\{.+\}|\<.+\>)$/i,
      /(?<title>.+?)\s+?(?<feat>[\[\(]?(?:feat(?:uring)?|ft)\b\.?)\s*?(?<artists>.+)\s*/i,
      /(?<title>.+?)(?:\s+?[\u2010\u2012\u2013\u2014~/-])(?![^(]*\))(?<dash>.*)/i,
    ];

    this.artistPatterns = [
      /(?<title>.+?)(?:\s*?,)(?<comma>.*)/i,
      /(?<title>.+?)(?:\s+?(&|with))(?<dash>.*)/i,
    ];

    this.parenGuffExpr = /(20[0-9]{2}|19[0-9]{2})/g;
  }

  dropForeignChars(text: string): string {
    let result = "";
    let hasForeign = false;
    let hasLetter = false;

    for (const char of text) {
      if (this.isCommonOrPreferredScript(char)) {
        result += char;
        if (/\p{L}/u.test(char)) {
          hasLetter = true;
        }
      } else {
        hasForeign = true;
      }
    }

    const cleaned = result.trim();
    if (hasForeign && cleaned.length > 0 && hasLetter) {
      return cleaned;
    }
    return text;
  }

  private isCommonOrPreferredScript(char: string): boolean {
    // Common characters (punctuation, digits, spaces, etc.)
    if (/[\p{P}\p{N}\p{Z}\p{S}\p{M}]/u.test(char)) {
      return true;
    }

    // Check preferred script
    switch (this.preferredScript) {
      case "Latin":
        return /\p{Script=Latin}/u.test(char);
      case "Han":
        return /\p{Script=Han}/u.test(char);
      case "Cyrillic":
        return /\p{Script=Cyrillic}/u.test(char);
      case "Devanagari":
        return /\p{Script=Devanagari}/u.test(char);
      default:
        return /\p{Script=Latin}/u.test(char);
    }
  }

  isParenTextLikelyGuff(parenText: string): boolean {
    let pt = parenText.toLowerCase();
    const beforeLen = [...pt].length;

    for (const guff of guffParenWords) {
      pt = pt.replaceAll(guff, "");
    }

    pt = pt.replace(this.parenGuffExpr, "");
    const afterLen = [...pt].length;
    const replaced = beforeLen - afterLen;

    let chars = 0;
    let guffChars = replaced;

    for (const ch of pt) {
      if (symbols.includes(ch)) {
        guffChars++;
      }
      if (/\p{L}/u.test(ch)) {
        chars++;
      }
    }

    return guffChars > chars;
  }

  parenChecker(text: string): boolean {
    const brackets = [
      { open: "(", close: ")" },
      { open: "[", close: "]" },
      { open: "{", close: "}" },
      { open: "<", close: ">" },
    ];

    for (const pair of brackets) {
      const openCount = (text.match(new RegExp(`\\${pair.open}`, "g")) || [])
        .length;
      const closeCount = (text.match(new RegExp(`\\${pair.close}`, "g")) || [])
        .length;
      if (openCount !== closeCount) {
        return false;
      }
    }
    return true;
  }

  cleanRecording(text: string): { text: string; changed: boolean } {
    text = text.trim();

    if (!this.parenChecker(text)) {
      return { text, changed: false };
    }

    text = this.dropForeignChars(text);
    let changed = false;

    for (const pattern of this.recordingPatterns) {
      const match = text.match(pattern);
      if (match?.groups) {
        const groups = match.groups;

        if (groups.enclosed && this.isParenTextLikelyGuff(groups.enclosed)) {
          text = groups.title.trim();
          changed = true;
          break;
        }

        if (groups.feat) {
          text = groups.title.trim();
          changed = true;
          break;
        }

        if (groups.dash && this.isParenTextLikelyGuff(groups.dash)) {
          text = groups.title.trim();
          changed = true;
          break;
        }
      }
    }

    return { text: text.trim(), changed };
  }

  cleanArtist(text: string): { text: string; changed: boolean } {
    text = text.trim();

    if (!this.parenChecker(text)) {
      return { text, changed: false };
    }

    text = this.dropForeignChars(text);
    let changed = false;

    for (const pattern of this.artistPatterns) {
      const match = text.match(pattern);
      if (match?.groups) {
        const title = match.groups.title.trim();
        if (title.length > 2 && /\p{L}/u.test(title[0])) {
          text = title;
          changed = true;
          break;
        }
      }
    }

    return { text: text.trim(), changed };
  }
}

export const metadataCleaner = new MetadataCleaner("Latin");
