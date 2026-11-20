import { useRef, useState } from 'preact/hooks';
import {
  avisoRondas, borrarJugador, crearTorneo, editarJugador, empezar, fijarRondas, inscribir,
} from '../torneo/acciones';
import type { Torneo } from '../torneo/tipos';
import type { Aplicar } from './App';

export function CrearTorneo({ crear }: { crear: (fn: () => Torneo) => boolean }) {
  const [nombre, setNombre] = useState('Torneo Lucero');
  const [rondas, setRondas] = useState('5');
  return (
    <form
      class="panel formulario"
      onSubmit={(e) => {
        e.preventDefault();
        const datos = new FormData(e.currentTarget);
        crear(() => crearTorneo(String(datos.get('nombre') ?? ''), Number(datos.get('rondas'))));
      }}
    >
      <h2>Nuevo torneo</h2>
      <label>
        Nombre del torneo
        <input name="nombre" value={nombre} onInput={(e) => setNombre(e.currentTarget.value)} placeholder="Torneo de otoño" />
      </label>
      <label>
        Número de rondas
        <input name="rondas" type="number" inputMode="numeric" min={1} value={rondas} onInput={(e) => setRondas(e.currentTarget.value)} />
      </label>
      <button class="boton-principal" type="submit">
        Crear torneo
      </button>
    </form>
  );
}

export function Inscripcion({ torneo, aplicar }: { torneo: Torneo; aplicar: Aplicar }) {
  const [nombre, setNombre] = useState('');
  const [elo, setElo] = useState('');
  const [editando, setEditando] = useState<string | null>(null);
  const campoNombre = useRef<HTMLInputElement>(null);
  const n = torneo.jugadores.length;
  const aviso = n >= 2 ? avisoRondas(n, torneo.rondasTotales) : null;

  const enviar = (e: SubmitEvent) => {
    e.preventDefault();
    const datos = new FormData(e.currentTarget as HTMLFormElement);
    const nombreActual = String(datos.get('nombre') ?? '');
    const eloActual = String(datos.get('elo') ?? '');
    const ok = editando
      ? aplicar((t) => editarJugador(t, editando, nombreActual, eloActual))
      : aplicar((t) => inscribir(t, nombreActual, eloActual));
    if (ok) {
      setNombre('');
      setElo('');
      setEditando(null);
    }
    campoNombre.current?.focus();
  };

  return (
    <section class="inscripcion">
      <form class="alta" onSubmit={enviar}>
        <h2>{editando ? 'Editar jugador' : 'Jugadores'}</h2>
        <div class="alta-campos">
          <label class="campo-nombre">
            Nombre
            <input ref={campoNombre} name="nombre" autoFocus value={nombre} onInput={(e) => setNombre(e.currentTarget.value)} autoComplete="off" />
          </label>
          <label class="campo-elo">
            ELO (opcional)
            <input name="elo" value={elo} inputMode="numeric" onInput={(e) => setElo(e.currentTarget.value)} autoComplete="off" />
          </label>
          <button type="submit">{editando ? 'Guardar cambios' : 'Añadir jugador'}</button>
        </div>
      </form>

      {n === 0 ? (
        <p class="vacio">Añade a los participantes. El ELO sirve para ordenar la primera ronda.</p>
      ) : (
        <ol class="lista-jugadores">
          {torneo.jugadores.map((j, i) => (
            <li key={j.id}>
              <span class="lista-num">{i + 1}</span>
              <span class="lista-nombre">{j.nombre}</span>
              <span class="lista-elo">{j.elo ?? 'sin ELO'}</span>
              <span class="lista-acciones">
              <button
                type="button"
                class="boton-texto"
                aria-label={`Editar a ${j.nombre}`}
                onClick={() => {
                  setEditando(j.id);
                  setNombre(j.nombre);
                  setElo(j.elo === null ? '' : String(j.elo));
                  campoNombre.current?.focus();
                }}
              >
                Editar
              </button>
              <button
                type="button"
                class="boton-texto"
                aria-label={`Quitar a ${j.nombre}`}
                onClick={() => aplicar((t) => borrarJugador(t, j.id))}
              >
                Quitar
              </button>
              </span>
            </li>
          ))}
        </ol>
      )}

      <div class="pie-inscripcion">
        <label class="campo-rondas">
          Rondas
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={torneo.rondasTotales}
            onChange={(e) => aplicar((t) => fijarRondas(t, Number(e.currentTarget.value)))}
          />
        </label>
        {aviso && <p class="nota">{aviso}</p>}
        <button class="boton-principal" type="button" onClick={() => aplicar(empezar)}>
          Empezar torneo
        </button>
      </div>
    </section>
  );
}
