import type { Torneo } from '../torneo/tipos';

const LOGO = `${import.meta.env.BASE_URL}logo-lucero.png`;

export function Cabecera({ torneo }: { torneo: Torneo | null }) {
  const enJuego = torneo && torneo.estado !== 'inscripcion' && torneo.rondas.length > 0;
  return (
    <header class="cabecera">
      <img class="cabecera-logo" src={LOGO} alt="Asociación Vecinal Lucero" width={127} height={62} />
      <div class="cabecera-titulo">
        {enJuego && torneo.estado === 'en-curso' ? (
          <>
            <h1 class="ronda-grande">Ronda {torneo.rondas.length}</h1>
            <p class="cabecera-sub">
              de {torneo.rondasTotales} · {torneo.nombre}
            </p>
          </>
        ) : (
          <>
            <h1 class="titulo-torneo">{torneo ? torneo.nombre : 'Torneo de ajedrez'}</h1>
            <p class="cabecera-sub">{torneo?.estado === 'terminado' ? 'Torneo terminado' : 'Fiestas de Lucero'}</p>
          </>
        )}
      </div>
    </header>
  );
}
