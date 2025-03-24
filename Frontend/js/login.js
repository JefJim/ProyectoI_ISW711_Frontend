document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });
        
        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.Id);
<<<<<<< HEAD
            
            window.location.href = '/Frontend/pages/dashboard.html'; // Redirigir al dashboard
=======
            window.location.href = '../pages/dashboard.html'; // Redirect to dashboard
>>>>>>> caf859564bc5a454520f25c0ff0289ff3666ff99
        } else {
            alert(data.error || 'Error al iniciar sesión');
        }
    } catch (error) {
        alert('Error al conectar con el servidor');
    }
});