
export function TextDisplay({ text }: { text: string }) {
  return (
    <div class="w-full p-4 border rounded bg-gray-50">
      <p class="text-gray-700">{text}</p>
    </div>
  );
}