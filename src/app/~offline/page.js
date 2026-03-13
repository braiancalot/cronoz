export default function OfflinePage() {
  return (
    <main className="w-full max-w-[1200] mx-auto h-dvh flex flex-col items-center justify-center px-8">
      <h1 className="text-lg font-bold tracking-tight mb-4">Sem conexão</h1>
      <p className="text-neutral-500 text-center text-sm">
        Você está offline. Verifique sua conexão e tente novamente.
      </p>
    </main>
  );
}
