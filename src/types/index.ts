export interface QuoteSection {
  id: string;
  key: string;
  title: string;
  icon?: string;
  content: SectionContent;
  isVisible: boolean;
  order: number;
}

export interface SectionContent {
  type: 'list' | 'text' | 'table' | 'timeline' | 'cards';
  items?: SectionItem[];
  text?: string;
  table?: { headers: string[]; rows: string[][] };
}

export interface SectionItem {
  title?: string;
  subtitle?: string;
  description?: string;
  icon?: string;
  items?: string[];
  link?: { text: string; url: string };
}

export interface Quote {
  id: string;
  token: string;
  companyName: string;
  contactName?: string;
  email?: string;
  phone?: string;
  projectName?: string;
  internalNotes?: string;
  projectPrice?: number;
  currency: string;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected';
  validUntil?: Date;
  createdAt: Date;
  sections: QuoteSection[];
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  sections: TemplateSection[];
}

export interface TemplateSection {
  id: string;
  key: string;
  title: string;
  icon?: string;
  isRequired: boolean;
  isDefault: boolean;
  content: SectionContent;
  order: number;
}

export interface Branding {
  logoUrl?: string;
  companyName: string;
  primaryColor: string;
  accentColor: string;
}
