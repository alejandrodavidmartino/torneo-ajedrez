import { exportar, importar, nombreArchivo } from '../torneo/copia';
import type { Torneo } from '../torneo/tipos';

interface Props {
  torneo: Torneo;
  /** Ejecuta un cambio que puede fallar con ErrorTorneo (lo muestra la App). */
  ejecutar: (fn: () => Torneo | null) => boolean;
}

export function Ajustes({ torneo, ejecutar }: Props) {
  const descargar = () => {
    const blob = new Blob([exportar(torneo)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo(torneo, new Date());
    a.click();
    URL.revokeObjectURL(url);
  };

  const cargar = async (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;
    const texto = await archivo.text();
    ejecutar(() => importar(texto));
    input.value = '';
  };

  const nuevo = () => {
    if (window.confirm('¿Empezar un torneo nuevo? Descarga antes la copia si quieres conservar este.')) {
      ejecutar(() => null);
    }
  };

  return (
    <section class="ajustes solo-pantalla" aria-labelledby="titulo-ajustes">
      <h2 id="titulo-ajustes">Copia de seguridad</h2>
      <p class="nota">
        El torneo se guarda solo en este aparato. Descarga una copia para pasarlo a otro móvil u ordenador.
      </p>
      <div class="ajustes-botones">
        <button type="button" onClick={descargar}>
          Descargar copia
        </button>
        <label class="boton-archivo">
          Cargar copia
          <input type="file" accept=".json,application/json" onChange={cargar} />
        </label>
        {torneo.estado !== 'inscripcion' && (
          <button type="button" onClick={() => window.print()}>
            Imprimir
          </button>
        )}
        <button type="button" class="boton-peligro" onClick={nuevo}>
          Nuevo torneo
        </button>
      </div>
    </section>
  );
}
