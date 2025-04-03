document.addEventListener('DOMContentLoaded', function () {
  const loadEl = document.querySelector('#load');
  // // 🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥
  // // The Firebase SDK is initialized and available here!
  //
  // firebase.auth().onAuthStateChanged(user => { });
  // firebase.database().ref('/path/to/ref').on('value', snapshot => { });
  // firebase.firestore().doc('/foo/bar').get().then(() => { });
  // firebase.functions().httpsCallable('yourFunction')().then(() => { });
  // firebase.messaging().requestPermission().then(() => { });
  // firebase.storage().ref('/path/to/ref').getDownloadURL().then(() => { });
  // firebase.analytics(); // call to activate
  // firebase.analytics().logEvent('tutorial_completed');
  // firebase.performance(); // call to activate
  //
  // // 🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥

  try {
    let app = firebase.app();
    let features = [
      'auth',
      'database',
      'firestore',
      'functions',
      'messaging',
      'storage',
      'analytics',
      'remoteConfig',
      'performance',
    ].filter(feature => typeof app[feature] === 'function');

    const { createApp, reactive, ref, onMounted, onUnmounted, computed } = Vue;

    createApp({
      setup() {
        // Estado de la aplicación
        const usuario = ref(null);
        const email = ref('');
        const password = ref('');
        const error = ref('');
        const vistaActual = ref('listar');
        const lotes = ref([]);
        const busqueda = ref('');
        const cargando = ref(false);
        let unsubscribeLotes = null;
        const downloadUrl = ref(null);
        const errorRegistro = ref(null);
        const errorHuerto = ref(null);
        const errorVariedad = ref(null);
        const errorEmpaque = ref(null);
        const errorEstado = ref(null);
        const errorMunicipio = ref(null);
        const errorFecha = ref(null);
        const errorTMINF = ref(null);
        const errorCajas = ref(null);
        const errorFrutosMuestreados = ref(null);
        const errorFrutosLarvados = ref(null);
        const errorToneladas = ref(null);
        const errorNumeroLarvas = ref(null);





        // Nuevo lote
        const nuevoLote = reactive({
          cFMN: 'N/A',
          cajas: '',
          empaque: '',
          estado: '',
          fecha: '', // Más directo que `new Date().getTime()`
          fechaGuardado: Date.now(),
          frutosLarvados: '',
          frutosMuestrados: '',
          huerto: '',
          id: '',
          municipio: '',
          nLarvados: '',
          periodo: '',
          porcentajedeInfestacion: '',
          registro: '',
          tEF: usuario?.displayName || '', // Evita error si usuario no está definido
          tMINF: '',
          terceria: 'normich',
          toneladas: '',
          userUid: usuario?.uid || '', // Asegúrate de que el campo sea `uid`
          variedad: '',
        });







        const filtrarLotes = () => {
          // No necesitamos hacer nada aquí porque usamos computed property
          // Pero mantenemos el método porque la plantilla lo referencia
          console.log('Filtrando lotes...', busqueda.value);
        };

        // Lotes filtrados
        const lotesFiltrados = computed(() => {
          if (!busqueda.value) return lotes.value;
          const termino = busqueda.value.toLowerCase();
          return lotes.value.filter(lote =>
            lote.huerto.toLowerCase().includes(termino) ||
            lote.registro.toLowerCase().includes(termino)
          );
        });

        // Métodos
        const iniciarSesion = async () => {
          error.value = '';
          try {
            await firebase.auth().signInWithEmailAndPassword(email.value, password.value);
          } catch (err) {
            error.value = err.message;
          }
        };

        const cerrarSesion = async () => {
          try {
            await firebase.auth().signOut();
            vistaActual.value = 'listar';
          } catch (err) {
            console.error('Error al cerrar sesión:', err);
          }
        };

        const cambiarVista = (vista) => {
          vistaActual.value = vista;
        };

        const formatearFecha = (timestamp) => {
          if (!timestamp) return 'Sin fecha';

          // Si es un objeto Timestamp de Firebase (tiene el método toDate)
          if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
            const fecha = timestamp.toDate();
            return `${fecha.getDate().toString().padStart(2, '0')}/${(fecha.getMonth() + 1).toString().padStart(2, '0')}/${fecha.getFullYear().toString().slice(-2)}`;
          }
          // Si es un timestamp numérico (como 1741068000000)
          else if (typeof timestamp === 'number') {
            const fecha = new Date(timestamp);
            return `${fecha.getDate().toString().padStart(2, '0')}/${(fecha.getMonth() + 1).toString().padStart(2, '0')}/${fecha.getFullYear().toString().slice(-2)}`;
          }
          // Si es una cadena de fecha ISO o similar
          else if (typeof timestamp === 'string') {
            const fecha = new Date(timestamp);
            if (!isNaN(fecha.getTime())) {
              return `${fecha.getDate().toString().padStart(2, '0')}/${(fecha.getMonth() + 1).toString().padStart(2, '0')}/${fecha.getFullYear().toString().slice(-2)}`;
            }
          }

          return 'Formato de fecha no válido';
        };

        const validarRegistro = () => {
          const longitud = nuevoLote.registro.length;
          if (longitud !== 14 && longitud !== 15) {
            errorRegistro.value = "El registro debe tener 14 o 15 caracteres.";

          } else {
            errorRegistro.value = null;
          }
        };




        const validarHuerto = () => {
          const longitud = nuevoLote.huerto.trim().length;
          if (longitud == 0) {
            errorHuerto.value = "El campo es requerido";

          } else {
            errorHuerto.value = null;
          }
        };

        const validarVariedad = () => {
          const longitud = nuevoLote.variedad.trim().length;
          if (longitud == 0) {
            errorVariedad.value = "Seleccione una variedad.";
          } else {
            errorVariedad.value = null;
          }
        };

        const validarEmpaque = () => {
          const longitud = nuevoLote.empaque.trim().length;
          if (longitud == 0) {
            errorEmpaque.value = "El campo es requerido";
          } else {
            errorEmpaque.value = null;
          }
        };

        const validarEstado = () => {
          const longitud = nuevoLote.estado.trim().length;
          if (longitud == 0) {
            errorEstado.value = "El campo es requerido";
          } else {
            errorEstado.value = null;
          }
        };

        const validarMunicipio = () => {
          const longitud = nuevoLote.municipio.trim().length;
          if (longitud == 0) {
            errorMunicipio.value = "El campo es requerido";
          } else {
            errorMunicipio.value = null;
          }
        };


        const validarFecha = () => {
          const fechaEntrada = new Date(nuevoLote.fecha);
          // Obtener la fecha actual
          const fechaActual = new Date();

          // Crear la fecha para el 1 de enero de este año
          const primerEnero = new Date(fechaActual.getFullYear(), 0, 1);  // Año actual, mes 0 (enero), día 1

          // Verificar que la fecha de entrada esté entre el 1 de enero y la fecha actual
          if (fechaEntrada >= primerEnero && fechaEntrada <= fechaActual) {
            errorFecha.value = null;  // La fecha es válida
          } else {
            errorFecha.value = "Fecha no validad";  // La fecha no está dentro del rango
          }
        };

        const validarTMINF = () => {
          const longitud = nuevoLote.tMINF.trim().length;
          if (longitud == 0) {
            errorTMINF.value = "El campo es requerido";
          } else {
            errorTMINF.value = null;
          }
        };

        const validarCFMN = () => {
          const longitud = nuevoLote.cFMN.trim().length;
          if (longitud == 0) {
            nuevoLote.cFMN = "N/A";
          }
        };

        const validarCajas = () => {
          const num = Number(nuevoLote.cajas.trim());
          if (!isNaN(num) && nuevoLote.cajas.trim() !== '') {
            errorCajas.value = null;
          } else {
            errorCajas.value = "No es un número valido";
          }
        };

        const validarToneladas = () => {
          const num = Number(nuevoLote.toneladas.trim());
          if (!isNaN(num) && nuevoLote.toneladas.trim() !== '') {
            errorToneladas.value = null;
          } else {
            errorToneladas.value = "No es un número valido";
          }
        };

        const validarFrutosMuestreados = () => {
          const num = Number(nuevoLote.frutosMuestrados.trim());
          if (!isNaN(num) && nuevoLote.frutosMuestrados.trim() !== '') {
            errorFrutosMuestreados.value = null;
          } else {
            errorFrutosMuestreados.value = "No es un número valido";
          }
          obtenerPorcentaje();
        };

        const validarFrutosLarvados = () => {
          const num = Number(nuevoLote.frutosLarvados.trim());
          if (!isNaN(num) && nuevoLote.frutosLarvados.trim() !== '') {
            errorFrutosLarvados.value = null;
          } else {
            errorFrutosLarvados.value = "No es un número valido";
          }
          obtenerPorcentaje();
        };

        const validarNumeroDeLarvas = () => {
          const num = Number(nuevoLote.nLarvados.trim());
          if (!isNaN(num) && nuevoLote.nLarvados.trim() !== '') {
            errorNumeroLarvas.value = null;
          } else {
            errorNumeroLarvas.value = "No es un número valido";
          }

        };

        const obtenerPorcentaje = () => {
          const frutosLarvados = Number(nuevoLote.frutosLarvados.trim());
          const frutosMuestreados = Number(nuevoLote.frutosMuestrados.trim());

          // Validamos que sean números válidos y que frutosMuestreados no sea 0 (para evitar división por 0)
          if (!isNaN(frutosMuestreados) && frutosMuestreados > 0 && !isNaN(frutosLarvados) && frutosLarvados >= 0) {
            nuevoLote.porcentajedeInfestacion = ((frutosLarvados / frutosMuestreados) * 100).toFixed(2);
          } else {
            nuevoLote.porcentajedeInfestacion = "0.00"; // Se mantiene formato con dos decimales
          }
        };




        const cargarLotes = () => {
          cargando.value = true;

          // Limpiamos cualquier suscripción previa
          if (unsubscribeLotes) {
            unsubscribeLotes();
          }

          // Suscribimos a cambios en tiempo real
          unsubscribeLotes = firebase.firestore()
            .collection('lotes_larvados')
            .onSnapshot((querySnapshot) => {
              lotes.value = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              })).sort((a, b) => b.fecha - a.fecha);
              cargando.value = false;
            }, (err) => {
              console.error('Error en suscripción:', err);
              cargando.value = false;
            });
        };

        function obtenerRangoSemana(fecha) {
          // Convertir la fecha a un objeto Date
          const fechaBase = new Date(fecha);

          // Obtener el día de la semana (0 = Domingo, 1 = Lunes, ..., 6 = Sábado)
          const diaSemana = fechaBase.getDay();

          // Ajustar para que la semana inicie en Lunes (1) y termine en Domingo (7)
          const lunes = new Date(fechaBase);
          lunes.setDate(fechaBase.getDate() - ((diaSemana + 6) % 7)); // Retroceder hasta el lunes

          const domingo = new Date(lunes);
          domingo.setDate(lunes.getDate() + 6); // Avanzar 6 días hasta el domingo

          // Formatear las fechas como "DD/MM/YYYY"
          const formatoFecha = (date) =>
            date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });

          return `Del ${formatoFecha(lunes)} al ${formatoFecha(domingo)}`;
        }

        const agregarLote = async () => {
          try {
            // Asegurar que los valores numéricos sean correctamente convertidos
            nuevoLote.value.cajas = Number(nuevoLote.cajas);
            nuevoLote.value.nLarvados = Number(nuevoLote.nLarvados);
            nuevoLote.value.frutosLarvados = Number(nuevoLote.frutosLarvados);
            nuevoLote.value.frutosMuestrados = Number(nuevoLote.frutosMuestrados);
            nuevoLote.value.porcentajedeInfestacion = Number(nuevoLote.porcentajedeInfestacion);
            nuevoLote.value.toneladas = Number(nuevoLote.toneladas);
            nuevoLote.value.tEF = usuario?.value.displayName || '';
            nuevoLote.value.userUid = usuario?.value.uid || '';
            nuevoLote.value.periodo = obtenerRangoSemana(new Date(nuevoLote.fecha));


            // Guardar en Firestore con fecha en milisegundos
            await firebase.firestore().collection('lotes_larvados').add({
              ...nuevoLote.value,
              fecha: new Date(nuevoLote.value.fecha).getTime(), // Equivalente a ToUnixTimeMilliseconds() en C#
              fechaGuardado: Date.now()
            });

            // Limpiar formulario
            nuevoLote.value = {
              cFMN: '',
              cajas: '',
              empaque: '',
              estado: '',
              fecha: '', // Reiniciar con timestamp actual
              fechaGuardado: Date.now(),
              frutosLarvados: '',
              frutosMuestrados: '',
              huerto: '',
              id: '',
              municipio: '',
              nLarvados: '',
              periodo: '',
              porcentajedeInfestacion: '',
              registro: '',
              tEF: usuario?.value.displayName || '',
              tMINF: '',
              terceria: 'normich',
              toneladas: '',
              userUid: usuario?.value.uid || '',
              variedad: ''
            };

            // Recargar lotes
            await cargarLotes();

            // Cambiar a vista de listado
            vistaActual.value = 'listar';

            // Mostrar alerta de éxito
            alert('Lote agregado correctamente');
          } catch (err) {
            console.error('Error agregando lote:', err);
            alert('Error al agregar el lote');
          }
        };

        //Exportar listado.
        const exportarExcel = async () => {

          if (!lotes.value || lotes.value.length === 0) {
            alert("No hay datos para exportar");
            return;
          }

          try {
            // 1. Preparar los datos filtrados
            const datosFiltrados = lotes.value.map(({ fecha, registro, huerto, empaque }) => ({
              Fecha: formatearFecha(fecha),
              Registro: registro,
              Huerto: huerto,
              Empaque: empaque
            }));


            // 2. Crear un nuevo libro de Excel con XlsxPopulate
            const workbook = await XlsxPopulate.fromBlankAsync();

            // 3. Obtener la hoja activa y renombrarla
            const sheet = workbook.sheet(0).name("Lotes");


            // 4. Insertar un título en A1 (fila 1, columna 1)

            // Combinar celdas de A2 a D2
            sheet.range("A1:D1").merged(true);

            // Insertar el texto en A2 (la celda principal después de la fusión)
            sheet.cell("A1").value("Lista de Lotes Larvados").style({
              bold: true,
              fontSize: 16,
              horizontalAlignment: "center", // Centrar horizontalmente
              verticalAlignment: "center" // Centrar verticalmente
            });

            sheet.range("A2:D2").style({
              bold: true,
              fontSize: 16,
              horizontalAlignment: "center",
              fill: "000000", // Fondo negro
              fontColor: "FFFFFF", // Texto blanco
              border: {
                top: { style: "thin", color: "FFFFFF" },
                bottom: { style: "thin", color: "FFFFFF" },
                left: { style: "thin", color: "FFFFFF" },
                right: { style: "thin", color: "FFFFFF" },
              }
            });;

            // 5. Insertar encabezados de columnas (fila 3)
            sheet.cell("A2").value("Fecha").style({ bold: true });
            sheet.cell("B2").value("Registro").style({ bold: true });
            sheet.cell("C2").value("Huerto").style({ bold: true });
            sheet.cell("D2").value("Empaque").style({ bold: true });

            // 6. Insertar los datos (desde la fila 4)
            datosFiltrados.forEach((lote, index) => {
              const row = 3 + index;
              let color = row % 2 === 0 ? "E0E0E0" : "FFFFFF"; // Filas pares grises, impares blancas
              sheet.range(`A${row}:D${row}`).style({
                fill: color, // Color de fondo
                fontColor: "000000", // Texto negro
                border: true, // Agregar bordes en todas las celdas
              });

              sheet.cell(`A${row}`).value(lote.Fecha);
              sheet.cell(`B${row}`).value(lote.Registro);
              sheet.cell(`C${row}`).value(lote.Huerto);
              sheet.cell(`D${row}`).value(lote.Empaque);
            });

            // 7. Insertar una imagen (opcional)
            // Ejemplo con una imagen en base64 (puedes reemplazarla con tu logo)


            // 8. Ajustar el ancho de las columnas automáticamente
            sheet.usedRange().style("horizontalAlignment", "center");
            sheet.column("A").width(15); // Fecha
            sheet.column("B").width(20); // Registro
            sheet.column("C").width(40); // Huerto
            sheet.column("D").width(50); // Empaque

            // 9. Descargar el archivo
            const blob = await workbook.outputAsync();
            const fileBlob = new Blob([blob], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            downloadUrl.value = URL.createObjectURL(fileBlob);

          } catch (err) {
            console.error("Error al exportar a Excel:", err);
            alert("Hubo un error al generar el reporte.");
          }
        };


        // Lifecycle hooks
        onMounted(() => {
          firebase.auth().onAuthStateChanged(user => {
            usuario.value = user;
            if (user) {
              cargarLotes();
            }
          });
        });

        onUnmounted(() => {
          if (unsubscribeLotes) {
            unsubscribeLotes();
          }
        });

        return {
          usuario,
          email,
          password,
          error,
          vistaActual,
          lotes,
          busqueda,
          lotesFiltrados,
          filtrarLotes,
          nuevoLote,
          iniciarSesion,
          cerrarSesion,
          cambiarVista,
          formatearFecha,
          agregarLote,
          exportarExcel,
          downloadUrl,
          validarHuerto,
          errorHuerto,
          validarRegistro,
          errorRegistro,
          validarVariedad,
          errorVariedad,
          validarEmpaque,
          errorEmpaque,
          validarEstado,
          errorEstado,
          validarMunicipio,
          errorMunicipio,
          validarFecha,
          errorFecha,
          validarTMINF,
          errorTMINF,
          validarCFMN,
          validarCajas,
          errorCajas,
          validarFrutosMuestreados,
          errorFrutosMuestreados,
          validarFrutosLarvados,
          errorFrutosLarvados,
          validarToneladas,
          errorToneladas,
          validarNumeroDeLarvas,
          errorNumeroLarvas
        };
      }
    }).mount('#app');
    //loadEl.textContent = `Firebase SDK loaded with ${features.join(', ')}`;
  } catch (e) {
    console.error(e);
    //loadEl.textContent = 'Error loading the Firebase SDK, check the console.';
  }
});