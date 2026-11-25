import { useState } from "react";
import { Pitch } from "./components/Pitch";
import type { ScreenId } from "./menu";
import { MainMenu } from "./screens/MainMenu";
import { ComingSoon } from "./screens/ComingSoon";
import { Editor } from "./screens/Editor";
import { Amistoso } from "./screens/Amistoso";
import type { Carreira as CarreiraT } from "@newbras/engine";
import { Carreira } from "./carreira/Carreira";
import { CarregarJogo } from "./carreira/CarregarJogo";
import { NovoJogo } from "./carreira/NovoJogo";

export function App() {
  const [screen, setScreen] = useState<ScreenId | null>(null);
  const [lastOpened, setLastOpened] = useState<ScreenId | null>(null);
  const [carreira, setCarreira] = useState<CarreiraT | null>(null);

  const open = (id: ScreenId) => {
    setLastOpened(id);
    setScreen(id);
  };

  if (carreira)
    return (
      <Carreira
        key={carreira.id}
        inicial={carreira}
        onSair={() => {
          setCarreira(null);
          setScreen(null);
        }}
      />
    );
  if (screen === "novo-jogo")
    return <NovoJogo onBack={() => setScreen(null)} onComecar={setCarreira} />;
  if (screen === "carregar")
    return <CarregarJogo onBack={() => setScreen(null)} onCarregar={setCarreira} />;
  if (screen === "editor") return <Editor onBack={() => setScreen(null)} />;
  if (screen === "amistoso") return <Amistoso onBack={() => setScreen(null)} />;

  return (
    <div className="relative min-h-dvh overflow-hidden">
      {/* Celular e tablet: o campo vira fundo. Desktop: o campo fica ao lado do painel. */}
      <Pitch className="absolute inset-0 h-full w-full lg:hidden" />
      <div className="absolute inset-y-10 right-10 left-[clamp(32rem,40%,42rem)] hidden lg:block">
        <Pitch fit="meet" className="h-full w-full" />
      </div>
      <main className="relative flex min-h-dvh items-center px-5 py-10 sm:px-12 lg:px-20">
        {screen === null ? (
          <MainMenu onOpen={open} initialFocus={lastOpened} />
        ) : (
          <ComingSoon id={screen} onBack={() => setScreen(null)} />
        )}
      </main>
    </div>
  );
}
