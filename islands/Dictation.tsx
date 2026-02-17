/// <reference path="../types/global.d.ts" />

import { Button } from "../components/Button.tsx";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";

type Mode = "Idle" | "Dictation";

type OnDeviceStatus =
  | "idle"
  | "checking"
  | "downloading"
  | "ready"
  | "unsupported"
  | "unavailable"
  | "error"
  | "listening";

function getCtor(): SpeechRecognitionConstructor | undefined {
  return globalThis.SpeechRecognition ?? globalThis.webkitSpeechRecognition;
}

export default function Dictation() {
  const [mode, setMode] = useState<Mode>("Idle");
  const [text, setText] = useState<string>("");
  const [lang, setLang] = useState("en-US");

  const [status, setStatus] = useState<OnDeviceStatus>("idle");
  const [diagnostic, setDiagnostic] = useState<string>("");

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const lastFinalIndexRef = useRef<number>(-1);

  const modeRef = useRef<Mode>("Idle");
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const supported = useMemo(() => Boolean(getCtor()), []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  function stopRecognition() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setStatus("idle");
    setDiagnostic("");
    lastFinalIndexRef.current = -1;
  }

  function attachHandlers(recognition: SpeechRecognition) {
    recognition.onresult = (event) => {
      // Only append NEW, FINAL results to avoid duplicate spam.
      // event.results is cumulative in continuous mode.
      const chunks: string[] = [];

      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (i <= lastFinalIndexRef.current) continue;

        const result = event.results[i];
        if (!result.isFinal) continue;

        const transcript = result[0]?.transcript ?? "";
        const trimmed = transcript.trim();
        if (trimmed.length === 0) continue;

        chunks.push(trimmed);
        lastFinalIndexRef.current = i;
      }

      if (chunks.length > 0) {
        setText((
          prev,
        ) => (prev ? `${prev} ${chunks.join(" ")}` : chunks.join(" ")));
      }
    };

    recognition.onerror = () => {
      setStatus("error");
      setDiagnostic("Speech recognition error. Try again.");
    };

    recognition.onend = () => {
      // If the user is still in Dictation mode, browsers may end unexpectedly.
      // We reflect idle status but keep mode as-is (so user can click Start again).
      if (modeRef.current === "Dictation") setStatus("idle");
    };
  }

  function startRecognition(
    Ctor: SpeechRecognitionConstructor,
    processLocally: boolean,
  ) {
    stopRecognition();

    const recognition = new Ctor();
    recognitionRef.current = recognition;

    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = false;

    if (processLocally) {
      recognition.processLocally = true;
    }

    attachHandlers(recognition);

    setStatus("listening");
    setDiagnostic(
      processLocally
        ? "Using on-device speech recognition (if supported by your browser)."
        : "Using browser speech recognition (on-device depends on browser/OS).",
    );

    recognition.start();
  }

  async function ensureOnDeviceAndStart() {
    const Ctor = getCtor();
    if (!Ctor) {
      setStatus("unsupported");
      setDiagnostic("Speech recognition is not supported in this browser.");
      return;
    }

    if (!Ctor.available || !Ctor.install) {
      startRecognition(Ctor, /*processLocally*/ false);
      return;
    }

    setStatus("checking");
    setDiagnostic("Checking if on-device language pack is available…");

    const availability = await Ctor.available({
      langs: [lang],
      processLocally: true,
    });

    if (availability === "unavailable") {
      setStatus("unavailable");
      setDiagnostic(
        `${lang} is not available to download for on-device recognition right now.`,
      );
      return;
    }

    if (availability === "available") {
      setStatus("ready");
      setDiagnostic("On-device language pack is available.");
      startRecognition(Ctor, /*processLocally*/ true);
      return;
    }

    setStatus("downloading");
    setDiagnostic("Downloading on-device language pack…");

    const ok = await Ctor.install({ langs: [lang], processLocally: true });
    if (!ok) {
      setStatus("error");
      setDiagnostic("Language pack download failed. Try again later.");
      return;
    }

    const availability2 = await Ctor.available({
      langs: [lang],
      processLocally: true,
    });
    if (availability2 === "available") {
      setStatus("ready");
      setDiagnostic(
        "Language pack downloaded. Starting on-device recognition…",
      );
      startRecognition(Ctor, /*processLocally*/ true);
    } else {
      setStatus("idle");
      setDiagnostic("Language pack state changed. Try starting again.");
    }
  }

  function toggleDictation() {
    const nextMode: Mode = mode === "Dictation" ? "Idle" : "Dictation";
    setMode(nextMode);

    if (nextMode === "Idle") {
      stopRecognition();
      return;
    }

    void ensureOnDeviceAndStart();
  }

  return (
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div class="max-w-4xl mx-auto">
        {/* Header */}
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-gray-800 mb-2">Voice Dictation</h1>
          <p class="text-gray-600">
            Speak naturally and watch your words appear
          </p>
        </div>

        {/* Mode Display */}
        <div class="bg-white rounded-lg shadow-md p-6 mb-3">
          <div class="flex items-center justify-center gap-3">
            <div
              class={`w-3 h-3 rounded-full ${
                mode === "Dictation"
                  ? "bg-green-500 animate-pulse"
                  : "bg-gray-400"
              }`}
            />
            <p class="text-xl font-semibold text-gray-700">
              Mode:{" "}
              <span
                class={mode === "Dictation"
                  ? "text-green-600"
                  : "text-gray-500"}
              >
                {mode}
              </span>
            </p>
          </div>
        </div>

        {/* Language Selector */}
        <div class="flex justify-center mb-6">
          <label class="flex items-center gap-2 text-sm text-gray-700">
            🌐 Language
            <select
              class="border rounded px-2 py-1"
              value={lang}
              onChange={(e) => {
                setLang((e.target as HTMLSelectElement).value);
              }}
              disabled={mode === "Dictation"}
            >
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="fr-FR">Français</option>
              <option value="es-ES">Español</option>
              <option value="de-DE">Deutsch</option>
            </select>
          </label>
        </div>

        {/* Status / Diagnostic */}
        <div class="text-center mb-6">
          {!supported
            ? (
              <p class="text-sm text-red-700">
                Speech recognition isn’t available in this browser.
              </p>
            )
            : (
              <p class="text-sm text-gray-600">
                <span class="font-semibold">Status:</span> {status}
                {diagnostic ? <span class="ml-2">• {diagnostic}</span> : null}
              </p>
            )}
        </div>

        {/* Control Buttons */}
        <div class="flex flex-wrap justify-center gap-4 mb-8">
          <Button onClick={toggleDictation} disabled={!supported}>
            <span class="flex items-center gap-2">
              🎤 {mode === "Dictation" ? "Stop" : "Start"} Dictation
            </span>
          </Button>

          <Button onClick={() => setText("")}>
            <span class="flex items-center gap-2">🗑️ Clear</span>
          </Button>
        </div>

        {/* Text Display Area */}
        <div class="bg-white rounded-lg shadow-lg p-8 min-h-[300px]">
          <div class="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
            <span class="text-2xl">📝</span>
            <h2 class="text-lg font-semibold text-gray-700">Transcript</h2>
          </div>
          <p class="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap">
            {text || (
              <span class="text-gray-400 italic">
                Your transcribed text will appear here...
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
