export function LanguageSwitch({
  locales,
  current,
}: {
  locales: { code: string; label: string }[];
  current: string;
}) {
  return (
    <div className="langs" role="group" aria-label="Dil">
      {locales.map((locale) => (
        <form key={locale.code} action="/api/lang" method="post">
          <input type="hidden" name="lang" value={locale.code} />
          <button type="submit" lang={locale.code} title={locale.label} aria-pressed={locale.code === current}>
            {locale.code.toUpperCase()}
          </button>
        </form>
      ))}
    </div>
  );
}
