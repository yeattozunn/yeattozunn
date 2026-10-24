// Scene starts, captions and hits, from the VO takes' silences (audio/vo/*.mp3; offsets match audio/score.py).
export const VO = { A: 0.4, TEYZE: 31.0, B: 37.4 };
export default function T(C) {
  const S = { market: 0, run: 8.4, home: 13.7, book: 17.6, peep: 27.0, end: VO.B + 3.4 };
  const KNOCKS = [29.65, 30.0, 30.35];
  const a = (s, e, txt, h = {}) => [s + VO.A, e + VO.A, txt, h];
  const CAP = [
    a(0, 1.53, 'SAAT 21:47', {}),
    a(1.89, 2.64, 'KADIKÖY ÇARŞI', { 'KADIKÖY': C.yel }),
    a(3.33, 4.36, 'BİR ADAM YERE YIĞILDI', { 'YIĞILDI': C.yel }),
    a(4.86, 6.11, 'SONRA... KALKTI', { 'KALKTI': C.red }),
    a(6.54, 7.58, 'VE YANINDAKİNİ ISIRDI', { 'ISIRDI': C.red }),
    a(8.07, 9.67, 'KALABALIK BANA DÖNDÜ. KOŞTUM', { 'KOŞTUM': C.yel }),
    a(9.94, 12.92, 'FIRININ ÖNÜNDEN, DÖNERCİNİN ÖNÜNDEN... ARKAMA BAKMADAN', { 'BAKMADAN': C.red }),
    a(13.36, 14.04, 'ALTINCI KAT', {}),
    a(14.4, 15.15, 'KAPIYI KİLİTLEDİM', { 'KİLİTLEDİM': C.yel }),
    a(15.61, 16.67, 'PAMUK KANEPEDE UYUYORDU', { PAMUK: C.yel }),
    a(17.24, 19.39, 'BABAMIN ESKİ DEFTERİ HÂLÂ ÇEKMECEDEYDİ', { 'DEFTERİ': C.yel }),
    a(19.79, 20.63, 'NE OLUR NE OLMAZ', {}),
    a(26.61, 28.24, 'GECE YARISINA İKİ DAKİKA VARDI', {}),
    a(28.58, 29.19, 'KAPI ÇALINDI', { 'ÇALINDI': C.red }),
    [VO.TEYZE, VO.TEYZE + 1.81, 'OĞLUM... BENİM,', {}],
    [VO.TEYZE + 2.08, VO.TEYZE + 3.15, 'NEVİN TEYZEN', { 'NEVİN': C.yel }],
    [VO.TEYZE + 3.85, VO.TEYZE + 5.76, 'AÇ KAPIYI... NE OLUR', { 'KAPIYI...': C.red }],
    [VO.B, VO.B + 2.6, 'KOLUNDA KANLI BİR BEZ VARDI', { KANLI: C.red }],
  ];
  const HITS = [
    [0, 'open', 'sub', { len: 2 }],
    [3.8, 'man falls', 'thud'],
    [7.0, 'bite', 'impact'],
    [S.run, 'run', 'whoosh', { len: 0.6 }],
    [S.home, 'door shut', 'thud', { pitch: 'A2' }],
    [14.9, 'lock', 'click'],
    [S.book, 'notebook', 'tick'],
    [21.44, 'rule 1', 'thud'],
    [23.1, 'rule 2', 'thud'],
    [24.73, 'rule 3', 'thud'],
    [S.peep, 'peephole', 'sub', { len: 1 }],
    ...KNOCKS.map((k, i) => [k, `knock ${i + 1}`, 'thud', { pitch: 'D3' }]),
    [VO.B, 'blood', 'swell'],
    [S.end, 'end card', 'impact'],
    [S.end + 0.8, 'buttons', 'pop', { pitch: 'A4' }],
  ];
  return { S, KNOCKS, CAP, HITS };
}
T.local = { fall: 3.4, rise: 5.9, bite: 6.95, rules: [21.44, 23.1, 24.73], openAt: 2.9 };
