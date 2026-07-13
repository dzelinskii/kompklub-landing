import { siteContent } from "@/content/site";

export function Gallery() {
  return (
    <section className="px-6 py-20 max-w-6xl mx-auto">
      <h2 className="text-4xl text-fog mb-10">Галерея</h2>
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {siteContent.gallery.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={src} src={src} alt={`Фото клуба ${i + 1}`} className="w-full h-40 object-cover border border-line" />
        ))}
      </div>
    </section>
  );
}
