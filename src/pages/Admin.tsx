import { RetroPanel } from "../components/retro/RetroPanel";

/*
  Admin placeholder.
  Real admin access must be protected before production.
*/
export function Admin() {
  return (
    <RetroPanel title="Admin Dashboard">
      <div className="section-intro">
        <h1>Admin dashboard planned.</h1>
        <p>
          This route is for development planning only. Protect it with authentication
          and role checks before storing customer/order data.
        </p>
      </div>
    </RetroPanel>
  );
}
