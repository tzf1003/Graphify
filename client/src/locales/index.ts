import zhCN from './zh-CN';
import en from './en';

export type LocaleMessages = typeof zhCN;
export type LocaleCode = 'zh-CN' | 'en';

export interface Language {
  code: LocaleCode;
  name: string;
  nativeName: string;
}

export const supportedLanguages: Language[] = [
  { code: 'zh-CN', name: 'Chinese', nativeName: '简体中文' },
  { code: 'en', name: 'English', nativeName: 'English' }
];

export const messages: Record<LocaleCode, LocaleMessages> = {
  'zh-CN': zhCN,
  'en': en
};

export { zhCN, en };
