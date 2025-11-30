import { useState } from "react";
import "./App.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
function App() {
  const [fromText, setFromText] = useState("");
  const [toText, setToText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTranslate = async () => {
    setLoading(true);
    setToText("");

    try {
      const res = await fetch(`${API_BASE_URL}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: fromText,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data: { text: string } = await res.json();
      setToText(data.text);
    } catch (err) {
      console.error(err);
      setToText("Error while translating.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>fiXmArgeLater</h1>
      <textarea
        placeholder="Type text here..."
        value={fromText}
        onChange={(e) => setFromText(e.target.value)}
      />
      <button onClick={handleTranslate} disabled={loading}>
        {loading ? "Translating..." : "Translate"}
      </button>
      <textarea
        placeholder="Translation will appear here..."
        value={toText}
        readOnly
      />
      <div>
        by{" "}
        <a
          href="https://x.com/xfoopy"
          target="_blank"
          rel="noreferrer"
        >
          xfoopy
        </a>{" "}
        |{" "}
        <a
          href="https://github.com/Foopy969/fixmargelater"
          target="_blank"
          rel="noreferrer"
        >
          source code
        </a>
      </div>
    </div>
  );
}

export default App;
