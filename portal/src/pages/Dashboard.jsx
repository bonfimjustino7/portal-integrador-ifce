import React from 'react';

export default function Dashboard({ user }) {
  return (
    <section className="page">
      <h1>Bem-vindo, {user.name}</h1>
      <p>Use o catalogo para acessar os sistemas universitarios integrados.</p>
    </section>
  );
}
