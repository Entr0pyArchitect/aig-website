import { useEffect, useState } from "react";

/*
  Public-facing retro terminal animation.
  This is intentionally cosmetic: it imitates an early-2000s local terminal boot
  without exposing real infrastructure, database names, secrets, or backend details.
*/

type TerminalLine = {
  text: string;
  tone?: "command" | "success" | "muted" | "progress";
};

const terminalLines: TerminalLine[] = [
  { text: "C:\\AIG\\PUBLIC_INTERFACE> dir /w", tone: "command" },
  { text: "[CATALOG]  [QUOTE-FLOW]  [PAYMENTS]  [SUPPORT]  [POLICIES]", tone: "muted" },
  { text: "C:\\AIG\\PUBLIC_INTERFACE> type CUSTOMER_FLOW.ini", tone: "command" },
  { text: "scope=requirements-first | quote=approval-before-payment | build=custom-solutions", tone: "muted" },
  { text: "C:\\AIG\\PUBLIC_INTERFACE> start quote_gateway.exe", tone: "command" },
  { text: "initializing customer request panel  [##########] 100%", tone: "progress" },
  { text: "C:\\AIG\\PUBLIC_INTERFACE> verify payment_options /status", tone: "command" },
  { text: "bitcoin=ready | paypal=ready | card=paypal-secure", tone: "success" },
  { text: "C:\\AIG\\PUBLIC_INTERFACE> launch engineering_art.ui", tone: "command" },
  { text: "AIG public interface online.", tone: "success" }
];

export function TerminalBoot() {
  const [visibleLines, setVisibleLines] = useState<TerminalLine[]>([]);
  const [cursorTick, setCursorTick] = useState(false);

  useEffect(() => {
    let index = 0;

    const timer = window.setInterval(() => {
      const nextLine = terminalLines[index];

      if (nextLine) {
        setVisibleLines((current) => [...current, nextLine]);
      }

      index += 1;

      if (index >= terminalLines.length) {
        window.clearInterval(timer);
      }
    }, 360);

    const cursorTimer = window.setInterval(() => {
      setCursorTick((current) => !current);
    }, 520);

    return () => {
      window.clearInterval(timer);
      window.clearInterval(cursorTimer);
    };
  }, []);

  return (
    <div className="vista-terminal" aria-label="AIG public interface terminal">
      <div className="vista-terminal-titlebar">
        <span className="vista-orb" aria-hidden="true" />
        <span>AIG Public Interface - Command Console</span>
        <div className="vista-window-buttons" aria-hidden="true">
          <span>_</span><span>□</span><span>×</span>
        </div>
      </div>

      <div className="vista-terminal-screen">
        <div className="vista-terminal-header">Microsoft Windows [Version 6.0.6002]</div>
        <div className="vista-terminal-header">(c) American Innovations Group. Public interface simulation.</div>

        {visibleLines.map((line, index) => (
          <div className={`vista-line ${line.tone || "muted"}`} key={`${line.text}-${index}`}>
            {line.text}
          </div>
        ))}

        <div className="vista-line command">
          C:\AIG\PUBLIC_INTERFACE&gt;<span className={cursorTick ? "vista-cursor active" : "vista-cursor"}>█</span>
        </div>
      </div>
    </div>
  );
}
