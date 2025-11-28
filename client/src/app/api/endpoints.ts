// se quiserem depois dá para importar o BASE_URL de um .env
const BASE_URL = 'http://localhost:4000'

export const API_ENDPOINTS = {
    auth : {
        login: `${BASE_URL}/auth/login`,
        register: `${BASE_URL}/auth/register`
    },
    profile : `${BASE_URL}/me`,
    reservation: `${BASE_URL}/reservations/users/`
}