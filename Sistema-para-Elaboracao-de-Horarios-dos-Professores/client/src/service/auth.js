import api from './api';
import { jwtDecode } from 'jwt-decode';

export const login = async (email, password) => {
    try {
        const response = await api.post('/login', { email, password });
        const { token } = response.data;

        if (!token) {
            throw new Error('Token não retornado pela API');
        }

        let decoded;
        try {
            decoded = jwtDecode(token);
            console.log('Token decodificado:', decoded);
        } catch (err) {
            throw new Error('Token inválido ou corrompido');
        }

        localStorage.setItem('token', token);
        localStorage.setItem('userId', decoded.id);
        localStorage.setItem('username', decoded.name);
        localStorage.setItem('role', decoded.role);
        return token;
    } catch (error) {
        if (error.response) {
            const message = error.response.data.message || 'Credenciais inválidas';
            throw new Error(message);
        } else {
            throw new Error('Erro ao conectar com o servidor');
        }
    }
};

export const logout = (setAuthenticated) => {
    try {
        localStorage.removeItem('token'); 
        localStorage.removeItem('role'); 
        localStorage.removeItem('username'); 
        setAuthenticated(false);
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
};

export const getToken = () => {
    return localStorage.getItem('token');
};

export const getUserId = () => {
    const token = getToken();
    if(token){
        try {
            const decoded = jwtDecode(token);
            return decoded.id;
        } catch (error) {
            console.error("Erro ao decodificar o token:", error);
            return null;
        }
    }
}

export const isTokenExpired = () => {
    try {
        const token = localStorage.getItem('token');

        const decode = jwtDecode(token);

        const exp = decode.exp;

        const now = Math.floor(Date.now() / 1000);

        return exp < now;
    } catch (error) {
        console.error("Erro ao verificar o token:", error);
        return true;
    }
}
