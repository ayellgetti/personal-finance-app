export function TableOfContents({ items }: { items: { id: string; label: string }[] }) {
  return (
    <nav aria-label="On this page" className="lg:sticky lg:top-24 lg:self-start">
      <p className="text-sm font-semibold text-foreground">On this page</p>
      <ul className="mt-3 space-y-2 border-l border-border pl-4 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`} className="hover:text-foreground">
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
