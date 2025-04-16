document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    if (!token || !userId) {
        window.location.href = '../pages/login.html';
        return;
    }

    setupRestrictedLinks();

    try {
        const fetchGraphQL = async (query, variables = {}) => {
            const response = await fetch('http://localhost:3000/graphql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ query, variables })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.errors?.[0]?.message || 'Error en la consulta');
            }

            return await response.json();
        };

        // GraphQL Query con variables
        const query = `
            query GetRestrictedUsersByFather($parentUser: ID!) {
                restrictedUserByFather(parentUser: $parentUser) {
                    _id
                    fullName
                    avatar
                    pin
                }
            }
        `;

        const result = await fetchGraphQL(query, { parentUser: userId });

        const usersContainer = document.getElementById('restrictedUsers');
        const users = result.data?.restrictedUserByFather;

        if (!users || users.length === 0) {
            usersContainer.innerHTML = '<p class="text-center text-gray-500">No hay usuarios restringidos</p>';
            return;
        }

        usersContainer.innerHTML = users.map(user => `
            <div class="bg-white p-4 rounded-lg shadow-md text-center">
                <img src="${user.avatar || 'default-avatar.png'}" 
                     alt="${user.fullName}" 
                     class="w-24 h-24 mx-auto rounded-full object-cover">
                <h2 class="text-xl font-semibold mt-2">${user.fullName}</h2>
                <p class="text-gray-500 mt-1">PIN: ${user.pin}</p>
                <button onclick="enterRestrictedUser('${user._id}')" 
                        class="mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
                    Entrar
                </button>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error:', error);
        if (error.message.includes('No autenticado')) {
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            window.location.href = '../pages/login.html';
        } else {
            alert(`Error: ${error.message}`);
        }
    }
});

async function enterRestrictedUser(userId) {
    const userPin = prompt('Ingrese el PIN del usuario restringido:');

    if (!userPin) {
        alert('Debe ingresar un PIN para continuar.');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/users/verify-pin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ id: userId, pin: userPin })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('restrictedUserId', userId);
            window.location.href = '../pages/restricted.html';
        } else {
            alert(data.error || 'PIN incorrecto. Intente de nuevo.');
        }
    } catch (error) {
        alert('Error al verificar el PIN. Intente nuevamente.');
    }
}

function setupRestrictedLinks() {
    const restrictedLink = document.querySelector('a[href="admin.html"]');
    const adminLink = document.querySelector('a[href="playlist.html"]');

    if (restrictedLink) {
        restrictedLink.addEventListener('click', async (event) => {
            event.preventDefault();
            verifyUserPin('admin.html');
        });
    }

    if (adminLink) {
        adminLink.addEventListener('click', async (event) => {
            event.preventDefault();
            verifyUserPin('playlist.html');
        });
    }
}

async function verifyUserPin(redirectUrl) {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        alert('Debes iniciar sesión primero.');
        return;
    }

    const userPin = prompt('Ingrese su PIN de verificación:');

    if (!userPin) {
        alert('Debe ingresar un PIN para continuar.');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/users/main/verify-pin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ id: userId, pin: userPin })
        });

        const data = await response.json();

        if (response.ok) {
            window.location.href = redirectUrl;
        } else {
            alert(data.error || 'PIN incorrecto. Intente de nuevo.');
        }
    } catch (error) {
        alert('Error al verificar el PIN. Intente nuevamente.');
    }
}

document.getElementById('logoutButton').addEventListener('click', () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
    window.location.href = 'login.html';
});
