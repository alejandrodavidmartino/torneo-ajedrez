import { reactivar, retirar } from '../torneo/acciones';
import { clasificacion } from '../torneo/calculos';
import type { Torneo } from '../torneo/tipos';
import type { Aplicar } from './App';

/** Muestra medios puntos como «½»: 1.5 → «1½». */
export function puntos(n: number): string {
  const entero = Math.floor(n);
  const medio = n - entero >= 0.5;
  if (!medio) return String(entero);
  return entero === 0 ? '½' : `${entero}½`;
}

export function Clasificacion({ torneo, aplicar, titulo = 'Clasificación' }: { torneo: Torneo; aplicar: Aplicar; titulo?: string }) {
  const filas = clasificacion(torneo);
  const enCurso = torneo.estado === 'en-curso';
  return (
    <section class="clasificacion imprimible" aria-labelledby="titulo-clasificacion">
      <h2 id="titulo-clasificacion">{titulo}</h2>
      <div class="tabla-contenedor">
        <table>
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Jugador</th>
              <th scope="col" class="num">Pts</th>
              <th scope="col" class="num" title="Buchholz">Buch.</th>
              <th scope="col" class="num" title="Sonneborn-Berger">S-B</th>
              <th scope="col" class="num" title="Partidas con blancas / con negras">B/N</th>
              {enCurso && <th scope="col" class="solo-pantalla"><span class="sr-only">Acciones</span></th>}
            </tr>
          </thead>
          <tbody>
            {filas.map(({ jugador, est, puesto }) => (
              <tr key={jugador.id} class={puesto === 1 ? 'lider' : jugador.retirado ? 'retirado' : undefined}>
                <td>{puesto}</td>
                <td>
                  {jugador.nombre}
                  {jugador.retirado && <span class="marca-retirado"> (retirado)</span>}
                </td>
                <td class="num pts">{puntos(est.puntos)}</td>
                <td class="num">{puntos(est.buchholz)}</td>
                <td class="num">{puntos(est.sonneborn)}</td>
                <td class="num">
                  {est.blancas}/{est.negras}
                </td>
                {enCurso && (
                  <td class="solo-pantalla">
                    <button
                      type="button"
                      class="boton-texto"
                      aria-label={`${jugador.retirado ? 'Reactivar' : 'Retirar'} a ${jugador.nombre}`}
                      onClick={() => aplicar((t) => (jugador.retirado ? reactivar(t, jugador.id) : retirar(t, jugador.id)))}
                    >
                      {jugador.retirado ? 'Reactivar' : 'Retirar'}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
