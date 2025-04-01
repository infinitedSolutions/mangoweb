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

    const { createApp, ref, onMounted, onUnmounted, computed } = Vue;

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

        // Nuevo lote
        const nuevoLote = ref({
          cFMN: '',
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
          variedad: ''
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
            nuevoLote.value.cajas = Number(nuevoLote.value.cajas);
            nuevoLote.value.nLarvados = Number(nuevoLote.value.nLarvados);
            nuevoLote.value.frutosLarvados = Number(nuevoLote.value.frutosLarvados);
            nuevoLote.value.frutosMuestrados = Number(nuevoLote.value.frutosMuestrados);
            nuevoLote.value.porcentajedeInfestacion = Number(nuevoLote.value.porcentajedeInfestacion);
            nuevoLote.value.toneladas = Number(nuevoLote.value.toneladas);
            nuevoLote.value.tEF = usuario?.value.displayName || '';
            nuevoLote.value.userUid = usuario?.value.uid || '';
            nuevoLote.value.periodo = obtenerRangoSemana(new Date(nuevoLote.value.fecha));

        
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
        const exportarExcel =  async () => {
          if (!lotesFiltrados.value || lotesFiltrados.value.length === 0) {
            alert("No hay datos para exportar");
            return;
          }
        
          try {
            // 1. Preparar los datos filtrados
            const datosFiltrados = lotesFiltrados.value.map(({ fecha, registro, huerto, empaque }) => ({
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
            sheet.cell("A1").value("Reporte de Lotes Larvados").style({
              bold: true,
              fontSize: 16,
              horizontalAlignment: "center"
            });
        
            // 5. Insertar encabezados de columnas (fila 3)
            sheet.cell("A3").value("Fecha").style({ bold: true });
            sheet.cell("B3").value("Registro").style({ bold: true });
            sheet.cell("C3").value("Huerto").style({ bold: true });
            sheet.cell("D3").value("Empaque").style({ bold: true });
        
            // 6. Insertar los datos (desde la fila 4)
            datosFiltrados.forEach((lote, index) => {
              const row = 4 + index;
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
            sheet.column("C").width(20); // Huerto
            sheet.column("D").width(15); // Empaque
        
            // 9. Descargar el archivo
            const blob = await workbook.outputAsync();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "lotes_larvados.xlsx";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        
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
          exportarExcel
        };
      }
    }).mount('#app');
    //loadEl.textContent = `Firebase SDK loaded with ${features.join(', ')}`;
  } catch (e) {
    console.error(e);
    //loadEl.textContent = 'Error loading the Firebase SDK, check the console.';
  }
});