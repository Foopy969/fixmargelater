import { useState } from "react";
import "./App.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
function App() {
  const [fromText, setFromText] = useState("");
  const [toText, setToText] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(true);
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
          caseSensitive,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data: { translatedText: string } = await res.json();
      setToText(data.translatedText);
    } catch (err) {
      console.error(err);
      setToText("Error while translating.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      fiXmArgeLater
      <textarea
        placeholder="Type text here..."
        value={fromText}
        onChange={(e) => setFromText(e.target.value)}
      />
      <label>
        <input
          type="checkbox"
          checked={caseSensitive}
          onChange={(e) => setCaseSensitive(e.target.checked)}
        />
        {" "}Case sensitive
      </label>
      <button onClick={handleTranslate} disabled={loading}>
        {loading ? "Translating..." : "Translate"}
      </button>
      <textarea
        placeholder="Translation will appear here..."
        value={toText}
        readOnly
      />
    </div>
  );
}

export default App;
