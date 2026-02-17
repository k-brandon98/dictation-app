/// <reference path="../types/global.d.ts" />

import { Button } from "../components/Button.tsx";
import { useState } from "preact/hooks";


export default function Dictation() {
  const [mode, setMode] = useState("Idle");
  const [text, setText] = useState("");

  function startDictation() {
    const Ctor =
      globalThis.SpeechRecognition ?? globalThis.webkitSpeechRecognition;

    if (!Ctor) {
      alert("Speech recognition not supported in this browser");
      return;
    }

    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.continuous = mode === "Dictation";
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      setText((prev) => prev + " " + transcript);
    };

    recognition.start();
  }

  return (
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div class="max-w-4xl mx-auto">
        {/* Header */}
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-gray-800 mb-2">Voice Dictation</h1>
          <p class="text-gray-600">Speak naturally and watch your words appear</p>
        </div>

        {/* Mode Display */}
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <div class="flex items-center justify-center gap-3">
            <div class={`w-3 h-3 rounded-full ${
              mode === "Dictation" ? "bg-green-500 animate-pulse" : 
              mode === "Command" ? "bg-blue-500 animate-pulse" : 
              "bg-gray-400"
            }`}></div>
            <p class="text-xl font-semibold text-gray-700">
              Mode: <span class={`${
                mode === "Dictation" ? "text-green-600" : 
                mode === "Command" ? "text-blue-600" : 
                "text-gray-500"
              }`}>{mode}</span>
            </p>
          </div>
        </div>

        {/* Control Buttons */}
        <div class="flex flex-wrap justify-center gap-4 mb-8">
          <Button
            onClick={() => {
              mode === "Dictation" ? setMode("Idle") : setMode("Dictation");
              startDictation();
              console.log(`mode: ${mode}`);
            }}
          >
            <span class="flex items-center gap-2">
              🎤 {mode === "Dictation" ? "Stop" : "Start"} Dictation
            </span>
          </Button>

          <Button
            onClick={() => {
              mode === "Command" ? setMode("Idle") : setMode("Command");
              console.log(`mode: ${mode}`);
              commandMode();
            }}
          >
            <span class="flex items-center gap-2">
              ⚡ {mode === "Command" ? "Stop" : "Start"} Commands
            </span>
          </Button>

          <Button
            onClick={() => setText("")}
          >
            <span class="flex items-center gap-2">
              🗑️ Clear
            </span>
          </Button>
        </div>

        {/* Text Display Area */}
        <div class="bg-white rounded-lg shadow-lg p-8 min-h-[300px]">
          <div class="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
            <span class="text-2xl">📝</span>
            <h2 class="text-lg font-semibold text-gray-700">Transcript</h2>
          </div>
          <p class="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap">
            {text || <span class="text-gray-400 italic">Your transcribed text will appear here...</span>}
          </p>
        </div>
      </div>
    </div>
  );
}


function commandMode() {
  // Placeholder for command mode logic
  console.log("Command mode activated");
}