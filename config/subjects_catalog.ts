export interface APCourseCatalogItem {
  slug: string;
  name: string;
  type: 'TEXT' | 'VISUAL' | 'LANGUAGE';
  unitsCount: number;
  examDate2026: string;
  icon: string;
}

export const LAUNCH_SUBJECTS_CATALOG: APCourseCatalogItem[] = [
  {
    slug: 'ap-us-history',
    name: 'AP US History',
    type: 'TEXT',
    unitsCount: 9,
    examDate2026: '2026-05-07',
    icon: '🇺🇸',
  },
  {
    slug: 'ap-world-history',
    name: 'AP World History',
    type: 'TEXT',
    unitsCount: 9,
    examDate2026: '2026-05-14',
    icon: '🌍',
  },
  {
    slug: 'ap-lang',
    name: 'AP English Language & Composition',
    type: 'TEXT',
    unitsCount: 9,
    examDate2026: '2026-05-13',
    icon: '✍️',
  },
  {
    slug: 'ap-calculus-ab',
    name: 'AP Calculus AB',
    type: 'VISUAL',
    unitsCount: 10,
    examDate2026: '2026-05-04',
    icon: '∫',
  },
  {
    slug: 'ap-chemistry',
    name: 'AP Chemistry',
    type: 'VISUAL',
    unitsCount: 9,
    examDate2026: '2026-05-04',
    icon: '🧪',
  },
  {
    slug: 'ap-biology',
    name: 'AP Biology',
    type: 'VISUAL',
    unitsCount: 8,
    examDate2026: '2026-05-08',
    icon: '🧬',
  },
];
