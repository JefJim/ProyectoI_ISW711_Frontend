document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        // Verifica si la respuesta es exitosa (código 200-299)
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error en las credenciales');
        }

        // Procesa la respuesta exitosa
        const data = await response.json();
        if (data.requires2FA) {
            // Mostrar modal para 2FA
            document.getElementById('twoFAModal').classList.remove('hidden');
            document.getElementById('verifyCodeBtn').setAttribute('data-email', email);
        } else {
            // Redirigir si no requiere 2FA (por si acaso)
            window.location.href = '/dashboard.html';
        }
    } catch (error) {
        console.error('Error en login:', error);
        alert(error.message || 'Error en el servidor');
    }
});
// Lógica para verificar el código 2FA
document.getElementById('verifyCodeBtn').addEventListener('click', async () => {
    const email = document.getElementById('verifyCodeBtn').getAttribute('data-email');
    const code = document.getElementById('verificationCode').value;

    try {
        const response = await fetch('http://localhost:3000/api/auth/verify-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code }),
        });
        console.log(response);
        // Verifica si la respuesta es exitosa (código 200-299)
        const data = await response.json();
        console.log(data);
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userId', data.Id);
            window.location.href = '../pages/dashboard.html';
        } else {
            alert(data.error || 'Código inválido');
        }
    } catch (error) {
        alert('Error al verificar el código');
    }
});

// Cerrar modal al cancelar
document.getElementById('cancel2FABtn').addEventListener('click', () => {
    document.getElementById('twoFAModal').classList.add('hidden');
});