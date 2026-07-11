import Link from "next/link";

interface GameCardProps {
  title: string;
  description: string;
  emoji: string;
  href: string;
  color: string;
  players?: string;
}

export default function GameCard({ title, description, emoji, href, color, players = "1 Player" }: GameCardProps) {
  return (
    <Link href={href} className="group block">
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${color} p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`}>
        <div className="absolute -right-4 -top-4 text-8xl opacity-20 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
          {emoji}
        </div>
        <div className="relative z-10">
          <span className="text-4xl mb-3 block">{emoji}</span>
          <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
          <p className="text-sm text-white/80 mb-3">{description}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded-full">
              {players}
            </span>
            <span className="text-sm font-medium text-white bg-white/20 px-3 py-1 rounded-full group-hover:bg-white/30 transition-colors">
              Play Now →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
