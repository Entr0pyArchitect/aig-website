import { RetroPanel } from "../components/retro/RetroPanel";
import { siteContent } from "../lib/siteData";

/*
  Free cybersecurity resources page.
  Public education content that supports credibility without compressing the product catalog.
*/
export function Resources() {
  const resources = siteContent.resources || [];

  return (
    <RetroPanel title="Cybersecurity Resources">
      <div className="section-intro section-intro--secondary">
        <h1>Free cybersecurity resources.</h1>
        <p>
          Practical starter guidance for students, builders, creators, and small businesses.
          These resources are educational and do not replace a scoped security engagement.
        </p>
      </div>

      <div className="resource-grid">
        {resources.map((resource) => (
          <article className="resource-card" key={resource.title}>
            <h3>{resource.title}</h3>
            <p>{resource.description}</p>
            <div className="category-pills compact">
              {resource.tags.map((tag) => <span key={tag}>{tag}</span>)}
            </div>
          </article>
        ))}
      </div>
    </RetroPanel>
  );
}
