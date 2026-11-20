import { useEffect, useRef, useState } from 'preact/hooks';
import { cargarAlEmpezar, guardar } from '../almacen';
import { ErrorTorneo, type Torneo } from '../torneo/tipos';
import { Ajustes } from './Ajustes';
import { Cabecera } from './Cabecera';
import { CrearTorneo, Inscripcion } from './Inscripcion';
import { VistaRonda } from './VistaRonda';
import './estilos.css';

/** Aplica una acción al torneo. Devuelve true si salió bien. */
export type Aplicar = (fn: (t: Torneo) => Torneo) => boolean;

export function App() {
  const [inicio] = useState(cargarAlEmpezar);
  const [torneo, setTorneo] = useState<Torneo | null>(inicio.torneo);
  const [error, setError] = useState<ErrorTorneo | null>(() =>
    inicio.danado
      ? new ErrorTorneo('guardado-danado', 'No se ha podido leer el torneo guardado en este aparato. Si tienes una copia descargada, cárgala.')
      : null,
  );
  // Último estado conocido, aunque la pantalla aún no se haya repintado:
  // así dos toques seguidos no se pisan.
  const actual = useRef(torneo);

  useEffect(() => guardar(torneo), [torneo]);

  const ejecutar = (fn: () => Torneo | null): boolean => {
    try {
      const nuevo = fn();
      actual.current = nuevo;
      setTorneo(nuevo);
      setError(null);
      return true;
    } catch (e) {
      if (e instanceof ErrorTorneo) {
        setError(e);
        return false;
      }
      throw e;
    }
  };
  const aplicar: Aplicar = (fn) => ejecutar(() => fn(actual.current!));

  return (
    <div class="app">
      <Cabecera torneo={torneo} />
      {error && (
        <p class="aviso solo-pantalla" role="alert">
          {error.message}
        </p>
      )}
      <main>
        {!torneo && <CrearTorneo crear={ejecutar} />}
        {torneo?.estado === 'inscripcion' && <Inscripcion torneo={torneo} aplicar={aplicar} />}
        {torneo && torneo.estado !== 'inscripcion' && <VistaRonda torneo={torneo} aplicar={aplicar} error={error} />}
        {torneo && <Ajustes torneo={torneo} ejecutar={ejecutar} />}
      </main>
    </div>
  );
}
