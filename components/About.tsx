import { siteContent } from "@/content/site";

export function About() {
  const { text, features } = siteContent.about;
  return (
    <section className="px-6 py-20 max-w-5xl mx-auto">
      <h2 className="text-4xl text-fog mb-6">О клубе</h2>
      <p className="text-muted text-lg mb-10 max-w-2xl">{text}</p>
      <div className="grid gap-6 md:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="border border-line p-6 bg-ink-soft">
            <h3 className="text-xl text-acid mb-2">{f.title}</h3>
            <p className="text-muted text-sm">{f.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
