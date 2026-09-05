import { TitleScreen } from "@/components/title-screen";
import { JobSelect } from "@/components/job-select";
import { PlayView } from "@/components/play-view";
import { useGameUI } from "@/game/store";

export function GameApp() {
  const screen = useGameUI((s) => s.screen);
  if (screen === "title") return <TitleScreen />;
  if (screen === "create") return <JobSelect />;
  return <PlayView />;
}
