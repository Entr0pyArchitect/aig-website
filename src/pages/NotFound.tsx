import { Link } from "react-router-dom";
import { RetroPanel } from "../components/retro/RetroPanel";

export function NotFound() {
  return (
    <RetroPanel title="404">
      <div className="empty-state">
        <p>Signal lost. This route does not exist.</p>
        <Link className="retro-button" to="/">Return Home</Link>
      </div>
    </RetroPanel>
  );
}
