export {};

declare global {
  type AvailabilityStatus =
    | "unavailable"
    | "downloadable"
    | "downloading"
    | "available";

  interface SpeechRecognitionAvailabilityOptions {
    langs: string[];
    processLocally?: boolean;
  }

  interface SpeechRecognitionInstallOptions {
    langs: string[];
    processLocally?: boolean;
  }

  interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
  }

  interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
  }

  interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }

  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
  }

  interface SpeechRecognition extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;

    processLocally?: boolean;

    start(): void;
    stop(): void;
    abort(): void;

    onresult:
      | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void)
      | null;
    onerror: ((this: SpeechRecognition, ev: Event) => void) | null;
    onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  }

  interface SpeechRecognitionConstructor {
    new (): SpeechRecognition;
    available?: (
      options: SpeechRecognitionAvailabilityOptions,
    ) => Promise<AvailabilityStatus>;
    install?: (options: SpeechRecognitionInstallOptions) => Promise<boolean>;
  }

  interface GlobalThis {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}
