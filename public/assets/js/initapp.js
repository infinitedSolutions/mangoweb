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
          agregarLote
        };
      }
    }).mount('#app');
    //loadEl.textContent = `Firebase SDK loaded with ${features.join(', ')}`;
  } catch (e) {
    console.error(e);
    //loadEl.textContent = 'Error loading the Firebase SDK, check the console.';
  }
});