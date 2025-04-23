// Zill v1 - Custom Web App Dashboard
// Frontend: React
// Backend: Google Sheets API (via Apps Script or OAuth2)

import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function ZillDashboard() {
  const [thoughts, setThoughts] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [income, setIncome] = useState(0);
  const [newThought, setNewThought] = useState('');
  const [copilotInput, setCopilotInput] = useState('');
  const [copilotResponse, setCopilotResponse] = useState('');

  // === Config ===
  const SHEET_API_BASE = 'https://script.google.com/macros/s/AKfycbyQG7pGTSe-wMj0gSpGOHgxdF57-ub97n1CA0G9Rbgup4NIIqVfQoO7wrRAp72nQ3_W8A/exec';

  // === Load Data ===
  useEffect(() => {
    loadThoughts();
    loadTasks();
    loadIncome();
  }, []);

  const loadThoughts = async () => {
    const res = await axios.get(`${SHEET_API_BASE}?sheet=Zill_Mind&filter=today`);
    setThoughts(res.data);
  };

  const loadTasks = async () => {
    const res = await axios.get(`${SHEET_API_BASE}?sheet=Zill_Action&priority=High&status=Done&limit=3`);
    setTasks(res.data);
  };

  const loadIncome = async () => {
    const res = await axios.get(`${SHEET_API_BASE}?sheet=Zill_Money&filter=weekSum`);
    setIncome(res.data.total);
  };

  const submitThought = async () => {
   await axios.post(`${SHEET_API_BASE}?sheet=Zill_Mind`,{
      data: {
        Thought: newThought,
        Tag: 'Goal',
        Context: 'Submitted from web',
        Date: new Date().toISOString().split('T')[0],
        'Is Today': true
      }
    });
    setNewThought('');
    loadThoughts();
  };

  const callGPTAgent = async (prompt) => {
    const res = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are Zill, a proactive and intelligent personal assistant who helps Mohamed reach his goals.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer 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`
        }
      }
    );
    return res.data.choices[0].message.content;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">🧠 Zill Dashboard</h1>

      {/* Prompt Thought */}
      <div className="bg-white rounded-xl shadow p-4 space-y-2">
        <h2 className="text-xl font-semibold">📝 Prompt Zill</h2>
        <input
          className="border p-2 w-full rounded"
          placeholder="Enter a new thought or goal..."
          value={newThought}
          onChange={(e) => setNewThought(e.target.value)}
        />
        <button onClick={submitThought} className="bg-blue-600 text-white px-4 py-2 rounded">
          Submit
        </button>
      </div>

      {/* Thought of the Day */}
      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="text-xl font-semibold mb-2">🧠 Thought of the Day</h2>
        {thoughts.map((t, i) => (
          <div key={i} className="border-b py-2">
            <div className="font-medium">{t.Thought}</div>
            <div className="text-sm text-gray-500">{t.Tag} • {t.Date}</div>
          </div>
        ))}
      </div>

      {/* Top Tasks */}
      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="text-xl font-semibold mb-2">✅ Top 3 Tasks</h2>
        <ul className="list-disc list-inside">
          {tasks.map((task, i) => (
            <li key={i} className="py-1">{task.Task} — <span className="text-sm text-gray-600">{task.Status}</span></li>
          ))}
        </ul>
      </div>

      {/* Weekly Income */}
      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="text-xl font-semibold">💰 This Week's Income</h2>
        <div className="text-2xl font-bold mt-2">${income}</div>
      </div>

      {/* GPT Copilot Section */}
      <div className="bg-white rounded-xl shadow p-4 space-y-2">
        <h2 className="text-xl font-semibold">🤖 Ask Zill Copilot</h2>
        <input
          className="border p-2 w-full rounded"
          placeholder="e.g. Help me earn $1K/week or Plan tomorrow"
          value={copilotInput}
          onChange={(e) => setCopilotInput(e.target.value)}
        />
       <button
  onClick={async () => {
const reply = await callGPTAgent(copilotInput);
setCopilotResponse(reply);

// Log GPT reply to Google Sheets
try {
  const res = await axios.post(`${SHEET_API_BASE}?sheet=Zill_Mind`, {
    data: {
      Thought: reply,
      Tag: 'AI Response',
      Context: copilotInput,
      Date: new Date().toISOString().split('T')[0],
      'Is Today': true
    }
  });

  console.log('✅ Saved to Zill_Mind:', res.data);
  loadThoughts(); // Reload the view
} catch (err) {
  console.error('❌ Failed to save to Zill_Mind:', err.response?.data || err.message);
}

    loadThoughts(); // Reload Thought of the Day
  }}
  className="bg-purple-600 text-white px-4 py-2 rounded"
>
  Ask Zill
</button>


        {copilotResponse && (
          <div className="mt-2 p-2 bg-gray-100 rounded border">{copilotResponse}</div>
        )}
      </div>
    </div>
  );
}


