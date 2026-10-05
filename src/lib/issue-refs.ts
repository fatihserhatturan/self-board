/**
 * Metindeki issue kimlikleri (`COR-12`). Önek kuralı proje oluşturmadakiyle
 * aynı (2-5 büyük harf, bkz. `lib/actions/projects.ts`). Kelime sınırları
 * sayesinde `XCOR-12` içinde `COR-12`, `COR-12a` içinde hiçbir şey bulunmuyor.
 * Bulunan kimliğin gerçekten var olup olmadığına çağıran karar veriyor.
 */
const ISSUE_REF_PATTERN = /\b[A-Z]{2,5}-\d+\b/g;

export interface IssueRefMatch {
  from: number;
  to: number;
  id: string;
}

export function findIssueRefs(text: string): IssueRefMatch[] {
  return [...text.matchAll(ISSUE_REF_PATTERN)].map((match) => ({
    from: match.index,
    to: match.index + match[0].length,
    id: match[0],
  }));
}
