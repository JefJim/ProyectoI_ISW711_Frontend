module.exports = {
    content: [
      "./pages/**/*.{html,js}",  // Escanea todos los archivos HTML y JS en la carpeta "pages"
      "./js/**/*.js",            // Escanea todos los archivos JS en la carpeta "js"
      "./index.html"             // Escanea el archivo index.html
    ],
    theme: {
      extend: {
        colors: {
          'primary': '#1fb6ff',  // Define un color personalizado
          'secondary': '#ff49db',
        },
        fontFamily: {
          'sans': ['Roboto', 'sans-serif'],  // Define una fuente personalizada
        },
      },
    },
    plugins: [],
  };