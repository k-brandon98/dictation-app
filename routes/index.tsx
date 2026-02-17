import Dictation from "../islands/Dictation.tsx";

export default function Home() {
  return (
    <div class="flex flex-col items-center gap-4 py-6">
      <h1 class="text-2xl font-bold">Welcome to the Dictation App</h1>
      <Dictation />
    </div>
  );
}