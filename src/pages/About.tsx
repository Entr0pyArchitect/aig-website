import { RetroPanel } from "../components/retro/RetroPanel";
import { siteContent } from "../lib/siteData";

/*
  About page: customer-facing major-development wrap copy.
*/
export function About() {
  return (
    <RetroPanel title="About AIG">
      <div className="section-intro section-intro--secondary">
        <h1>{siteContent.company.name}</h1>
        <p>{siteContent.company.summary}</p>
      </div>
      <div className="content-stack">
        <p>
          AIG is being built as a practical innovation company focused on quote-based
          technical products and engineering support. The current catalog centers on embedded
          systems, industrial equipment, manufacturing equipment, software solutions, and
          custom technical consulting.
        </p>
        <p>
          The company direction blends maker culture, practical engineering, technical media,
          customer-defined specifications, and a clean quote-to-fulfillment workflow for customer projects.
        </p>
      </div>
    </RetroPanel>
  );
}
