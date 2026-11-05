import { useEffect, useState } from 'preact/hooks';
import { cargar, guardar } from '../almacen';
import { ErrorTorneo, type Torneo } from '../torneo/tipos';
import { Cabecera } from './Cabecera';
import { CrearTorneo, Inscripcion } from './Inscripcion';
import './estilos.css';

/** Aplica una acción al torneo. Devuelve true si salió bien. */
export type Aplicar = (fn: (t: Torneo) => Torneo) => boolean;

export function App() {
  const [torneo, setTorneo] = useState<Torneo | null>(() => cargar());
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => guardar(torneo), [torneo]);

  const ejecutar = (fn: () => Torneo | null): boolean => {
    try {
      setTorneo(fn());
      setAviso(null);
      return true;
    } catch (e) {
      if (e instanceof ErrorTorneo) {
        setAviso(e.message);
        return false;
      }
      throw e;
    }
  };
  const aplicar: Aplicar = (fn) => ejecutar(() => fn(torneo!));

  return (
    <div class="app">
      <Cabecera torneo={torneo} />
      {aviso && (
        <p class="aviso" role="alert">
          {aviso}
        </p>
      )}
      <main>
        {!torneo && <CrearTorneo crear={(fn) => ejecutar(fn)} />}
        {torneo?.estado === 'inscripcion' && <Inscripcion torneo={torneo} aplicar={aplicar} />}
      </main>
    </div>
  );
}
