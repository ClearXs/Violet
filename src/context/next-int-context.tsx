import { NextIntlClientProvider } from 'next-intl';
import { useEffect, useState } from 'react';

// 加载语言文件
async function loadMessages(locale: string) {
  try {
    return (await import(`../../i18n/${locale}.json`)).default;
  } catch (error) {
    console.error(`Failed to load messages for locale: ${locale}`, error);
    // 如果加载失败，返回英文作为后备
    return (await import(`../../i18n/zh.json`)).default;
  }
}

export default function NextIntlProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [messages, setMessages] = useState<any>(null);
  const [locale, setLocale] = useState<string>('zh');

  useEffect(() => {
    const savedLocale = localStorage.getItem('app-language') || 'zh';
    setLocale(savedLocale);

    loadMessages(savedLocale).then(setMessages);
  }, []);

  if (!messages) {
    return null;
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
