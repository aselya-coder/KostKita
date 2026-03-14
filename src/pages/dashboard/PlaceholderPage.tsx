import { BackButton } from "@/components/BackButton";

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <BackButton />
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground">This page is under development.</p>
      </div>
      <div className="bg-card rounded-2xl border border-border p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <span className="text-2xl">🚧</span>
        </div>
        <h3 className="text-lg font-semibold">Coming Soon</h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
          We're working hard to bring you the {title} feature. Stay tuned!
        </p>
      </div>
    </div>
  );
}
