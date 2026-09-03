(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CCMSubtitleJson = api;
})(typeof window !== 'undefined' ? window : this, function() {
  'use strict';
  function languageCode(value) {
    const code = String(value || '').trim().replace(/-/g, '_').toUpperCase();
    return ({ZH:'ZH',CHN:'ZH',CN:'ZH',ZH_CN:'ZH',EN:'EN',KO:'KR',KR:'KR',MS:'MY',MY:'MY',JA:'JP',JP:'JP',LO:'LAO',LAO:'LAO'})[code] || code;
  }
  function parse(value) {
    const data = typeof value === 'string' ? JSON.parse(value.replace(/^\uFEFF/, '')) : value;
    if (!data || typeof data !== 'object' || !data.subtitles || Array.isArray(data.subtitles)) throw new Error('JSON需要subtitles语种对象 / Expected subtitles object');
    const entries = Object.entries(data.subtitles);
    if (!entries.length || entries.length > 30) throw new Error('字幕需包含1–30种语言 / Expected 1–30 languages');
    const used = new Set(); let total = 0;
    const languages = entries.map(([key, rows]) => {
      const code = languageCode(key);
      if (!/^[A-Z][A-Z0-9_]{1,15}$/.test(code) || used.has(code)) throw new Error('语种代码无效或重复 / Invalid or duplicate language: ' + key);
      used.add(code);
      if (!Array.isArray(rows) || !rows.length || (total += rows.length) > 30000) throw new Error('字幕数组为空或总条数超过30000 / Invalid cue count: ' + key);
      let previousEnd = -1;
      const cues = rows.map((row, index) => {
        if (!row || typeof row.start !== 'number' || typeof row.end !== 'number' || !Number.isFinite(row.start) || !Number.isFinite(row.end) || row.start < 0 || row.end <= row.start || row.end > 86400 || row.start < previousEnd - 0.001 || typeof row.text !== 'string' || !row.text.trim() || row.text.length > 10000) throw new Error(`字幕时间或文字无效 / Invalid cue: ${key} #${index + 1}`);
        previousEnd = row.end;
        return { start: row.start, end: row.end, text: row.text };
      });
      const label = String(data.meta?.languages?.[key] || key).trim();
      if (!label || label.length > 100) throw new Error('语种名称过长 / Invalid language label');
      return { code, key, label, cues };
    });
    const requestedDefault = languageCode(data.meta?.defaultLanguage || 'ZH');
    return { languages, defaultLanguage: used.has(requestedDefault) ? requestedDefault : languages[0].code };
  }
  return { parse, languageCode };
});
