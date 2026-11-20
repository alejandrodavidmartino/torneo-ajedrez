import { deshacerRonda, registrarResultado, siguienteRonda, terminarAntes } from '../torneo/acciones';
import type { ErrorTorneo, Mesa, Resultado, Ronda, Torneo } from '../torneo/tipos';
import type { Aplicar } from './App';
import { Clasificacion } from './Clasificacion';
import { Peon } from './Peon';

const BOTONES: [Resultado, string, string][] = [
  ['1-0', '1–0', 'gana blancas'],
  ['½-½', '½', 'tablas'],
  ['0-1', '0–1', 'gana negras'],
];

function textoPendientes(n: number): string {
  if (n === 0) return 'Todo apuntado';
  return n === 1 ? 'Falta 1 resultado' : `Faltan ${n} resultados`;
}

function MesaFila({ ronda, mesa, nombres, aplicar }: { ronda: Ronda; mesa: Mesa; nombres: Map<string, string>; aplicar: Aplicar }) {
  const poner = (r: Resultado | null) => aplicar((t) => registrarResultado(t, ronda.numero, mesa.numero, r));
  const incomparecencia =
    mesa.resultado === '1F-0F' ? 'Gana blancas por incomparecencia' : mesa.resultado === '0F-1F' ? 'Gana negras por incomparecencia' : null;
  return (
    <div class="mesa" role="group" aria-label={`Mesa ${mesa.numero}`}>
      <span class="mesa-num" aria-hidden="true">
        {mesa.numero}
      </span>
      <span class="mesa-jugadores">
        <span class="jugador">
          <Peon color="blanco" />
          <span class="sr-only">Blancas: </span>
          {nombres.get(mesa.blancas)}
        </span>
        <span class="jugador">
          <Peon color="negro" />
          <span class="sr-only">Negras: </span>
          {nombres.get(mesa.negras)}
        </span>
      </span>
      <span class="mesa-resultado">
        <span class="botones-resultado solo-pantalla">
          {BOTONES.map(([r, texto, descripcion]) => (
            <button
              key={r}
              type="button"
              aria-pressed={mesa.resultado === r}
              title={descripcion}
              onClick={() => poner(mesa.resultado === r ? null : r)}
            >
              {texto}
            </button>
          ))}
        </span>
        <span class="resultado-impreso" aria-hidden="true">
          {mesa.resultado ? mesa.resultado.replace('-', '–') : '___'}
        </span>
        {incomparecencia && <span class="nota-mesa">{incomparecencia}</span>}
        <details class="mas solo-pantalla">
          <summary>Más</summary>
          <button type="button" class="boton-texto" onClick={() => poner('0F-1F')}>
            No se presentó blancas
          </button>
          <button type="button" class="boton-texto" onClick={() => poner('1F-0F')}>
            No se presentó negras
          </button>
        </details>
      </span>
    </div>
  );
}

function ListaMesas({ ronda, nombres, aplicar }: { ronda: Ronda; nombres: Map<string, string>; aplicar: Aplicar }) {
  return (
    <>
      {ronda.mesas.map((m) => (
        <MesaFila key={m.numero} ronda={ronda} mesa={m} nombres={nombres} aplicar={aplicar} />
      ))}
      {ronda.descansa && <p class="descanso">{nombres.get(ronda.descansa)} descansa esta ronda y suma 1 punto.</p>}
    </>
  );
}

function RondasAnteriores({ torneo, nombres, aplicar }: { torneo: Torneo; nombres: Map<string, string>; aplicar: Aplicar }) {
  const cerradas = torneo.rondas.filter((r) => r.cerrada).reverse();
  if (cerradas.length === 0) return null;
  return (
    <section class="anteriores solo-pantalla">
      <h2>Rondas anteriores</h2>
      <p class="nota">Si te equivocaste al apuntar un resultado, corrígelo aquí. La clasificación se recalcula sola.</p>
      {cerradas.map((r) => (
        <details key={r.numero}>
          <summary>Ronda {r.numero}</summary>
          <ListaMesas ronda={r} nombres={nombres} aplicar={aplicar} />
        </details>
      ))}
    </section>
  );
}

export function VistaRonda({ torneo, aplicar, error }: { torneo: Torneo; aplicar: Aplicar; error: ErrorTorneo | null }) {
  const nombres = new Map(torneo.jugadores.map((j) => [j.id, j.nombre]));

  if (torneo.estado === 'terminado') {
    return (
      <div class="vista-final">
        <Clasificacion torneo={torneo} aplicar={aplicar} titulo="Clasificación final" />
        <RondasAnteriores torneo={torneo} nombres={nombres} aplicar={aplicar} />
      </div>
    );
  }

  const actual = torneo.rondas[torneo.rondas.length - 1];
  const pendientes = actual.mesas.filter((m) => m.resultado === null).length;
  const esUltima = actual.numero >= torneo.rondasTotales;
  const puedeDeshacer = actual.numero > 1 && actual.mesas.every((m) => m.resultado === null);

  return (
    <>
      <div class="vista-ronda">
        <section class="partidas imprimible" aria-labelledby="titulo-partidas">
          <h2 id="titulo-partidas">Partidas</h2>
          <ListaMesas ronda={actual} nombres={nombres} aplicar={aplicar} />
          <div class="pie-ronda solo-pantalla">
            <span class="pendientes">{textoPendientes(pendientes)}</span>
            <span class="pie-botones">
              {puedeDeshacer && (
                <button type="button" onClick={() => aplicar(deshacerRonda)}>
                  Deshacer ronda
                </button>
              )}
              <button class="boton-principal" type="button" onClick={() => aplicar(siguienteRonda)}>
                {esUltima ? 'Terminar torneo' : 'Siguiente ronda'}
              </button>
            </span>
          </div>
          {error && ['sin-emparejamiento', 'sin-descanso', 'pocos-activos'].includes(error.codigo) && (
            <button class="boton-principal solo-pantalla" type="button" onClick={() => aplicar(terminarAntes)}>
              Terminar torneo aquí
            </button>
          )}
        </section>
        <Clasificacion torneo={torneo} aplicar={aplicar} />
      </div>
      <RondasAnteriores torneo={torneo} nombres={nombres} aplicar={aplicar} />
    </>
  );
}
