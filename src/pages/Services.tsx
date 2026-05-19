import { RetroPanel } from "../components/retro/RetroPanel";
import { siteContent } from "../lib/siteData";

/*
  Services page polished for major-development wrap.
*/
export function Services() {
  return (
    <RetroPanel title="Services">
      <div className="section-intro section-intro--services">
        <h1>Engineering support from concept to scoped quote.</h1>
        <p>
          AIG supports hardware, embedded systems, manufacturing-adjacent equipment,
          software solutions, and technical consulting through a quote-first workflow.
        </p>
      </div>
      <div className="service-grid">
        {siteContent.services.map((service) => (
          <article className="service-card" key={service.title}>
            <h3>{service.title}</h3>
            <p>{service.description}</p>
          </article>
        ))}
      </div>
    </RetroPanel>
  );
}
